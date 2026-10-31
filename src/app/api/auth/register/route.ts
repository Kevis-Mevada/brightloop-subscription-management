import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { hashPassword, validatePassword, setSessionCookie } from "@/lib/auth";
import { sendEmail, getVerificationEmailHtml } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, organizationName } = body;

    if (!name || !email || !password || !organizationName) {
      return NextResponse.json(
        { success: false, error: "All fields are required." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    // Password validation rule
    const passwordCheck = validatePassword(password);
    if (!passwordCheck.isValid) {
      return NextResponse.json(
        { success: false, error: passwordCheck.message },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: trimmedEmail },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "An account with this email already exists." },
        { status: 400 }
      );
    }

    // Generate slug from org name
    const baseSlug = organizationName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    const slug = `${baseSlug}-${randomSuffix}`;

    const hashedPassword = await hashPassword(password);

    // Create Organization and Admin User
    const result = await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: organizationName.trim(),
          slug,
          currency: "USD",
        },
      });

      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: trimmedEmail,
          passwordHash: hashedPassword,
          role: "ORGANIZATION_ADMIN",
          status: "ACTIVE",
          organizationId: organization.id,
          emailVerified: new Date(),
        },
      });

      // Create default tax rule for the organization
      await tx.taxRule.create({
        data: {
          organizationId: organization.id,
          name: "Standard Sales Tax (10%)",
          rate: 10.0,
          isDefault: true,
          status: true,
        },
      });

      // Audit log
      await tx.auditLog.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          action: "ORGANIZATION_REGISTERED",
          entity: "Organization",
          entityId: organization.id,
          details: JSON.stringify({ orgName: organization.name, adminEmail: user.email }),
        },
      });

      return { organization, user };
    });

    // Send welcome email asynchronously
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    sendEmail({
      organizationId: result.organization.id,
      to: result.user.email,
      subject: "Welcome to Brightloop!",
      templateName: "welcome_email",
      html: getVerificationEmailHtml(result.user.name, `${appUrl}/login`),
    }).catch((e) => console.error("Email send failed in register:", e));

    const response = NextResponse.json({
      success: true,
      message: "Organization and admin registered successfully.",
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        role: result.user.role,
        organizationId: result.organization.id,
        organizationName: result.organization.name,
      },
    });

    await setSessionCookie(response, {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      role: result.user.role,
      status: result.user.status,
      organizationId: result.organization.id,
      customerId: null,
      organizationName: result.organization.name,
    });

    return response;
  } catch (error: any) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to register" },
      { status: 500 }
    );
  }
}
