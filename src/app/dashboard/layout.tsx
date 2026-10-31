import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/db";
import { Sidebar } from "@/components/dashboard/Sidebar";

export const metadata = {
  title: "Dashboard | Brightloop",
  description: "Subscription Management System",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  if (session.role === "CUSTOMER") {
    redirect("/portal");
  }

  // Fetch organization name if user belongs to one
  let orgName: string | null = null;
  if (session.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: session.organizationId },
      select: { name: true, isSuspended: true },
    });
    orgName = org?.name || null;

    if (org?.isSuspended && session.role !== "SUPER_ADMIN") {
      redirect("/login?error=Organization%20is%20suspended");
    }
  }

  const enrichedUser = {
    ...session,
    organizationName: orgName,
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <Sidebar user={enrichedUser} />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
