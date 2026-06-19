import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  LayoutDashboard,
  ClipboardList,
  Users,
  Store,
  FileText,
  ShieldCheck,
} from "lucide-react";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/auth/signin");

  // Fetch role from DB — do NOT rely solely on session token
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });

  if (!user || user.role === "VENDOR") redirect("/vendor/dashboard");

  const isAdmin = user.role === "ADMIN";

  const navLinks = [
    { href: "/staff/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/staff/queue", label: "Applications", icon: ClipboardList },
    { href: "/staff/vendors", label: "Vendors", icon: Store },
    { href: "/staff/users", label: "Team", icon: Users },
    { href: "/staff/docs", label: "Documents", icon: FileText },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-56 shrink-0 border-r border-border bg-card flex flex-col">
        {/* Logo / brand */}
        <div className="h-14 flex items-center px-4 border-b border-border">
          <span className="font-semibold text-sm tracking-tight text-foreground">
            FairHub Staff
          </span>
        </div>

        {/* Primary nav */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          ))}

          {/* Admin Panel — ADMIN role only */}
          {isAdmin && (
            <>
              <div className="my-2 border-t border-border" />
              <Link
                href="/admin"
                className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                Admin Panel
              </Link>
            </>
          )}
        </nav>

        {/* Bottom: signed-in user */}
        <div className="px-3 py-3 border-t border-border">
          <p className="text-xs text-muted-foreground truncate">
            {session.user.email}
          </p>
          <p className="text-xs font-medium text-foreground mt-0.5">
            {user.role}
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
