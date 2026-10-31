import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { comparePassword, setSessionCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: trimmedEmail },
      include: {
        organization: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.status === "SUSPENDED") {
      return NextResponse.json(
        { success: false, error: "Your account has been suspended. Please contact support." },
        { status: 403 }
      );
    }

    if (user.organization?.isSuspended && user.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, error: "Your organization has been suspended. Please contact support." },
        { status: 403 }
      );
    }

    let redirectUrl = "/dashboard";
    if (user.role === "SUPER_ADMIN") {
      redirectUrl = "/super-admin";
    } else if (user.role === "CUSTOMER") {
      redirectUrl = "/portal";
    }

    const response = NextResponse.json({
      success: true,
      message: "Signed in successfully",
      redirectUrl,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        organizationId: user.organizationId,
        customerId: user.customerId,
        organizationName: user.organization?.name || null,
      },
    });

    await setSessionCookie(response, {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      organizationId: user.organizationId,
      customerId: user.customerId,
      organizationName: user.organization?.name || null,
    });

    return response;
  } catch (error: any) {
    console.error("Login Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to sign in" },
      { status: 500 }
    );
  }
}
