import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";
import {
  LayoutDashboard,
  Users,
  History,
  Star,
  UserCheck,
  BarChart3,
  LogOut,
  Bell,
  Settings,
  ClipboardList,
  Layers,
  Building2,
} from "lucide-react";

type NavItem = { href: string; label: string; icon: React.ReactNode };

function navFor(role: Role): NavItem[] {
  const dashboard: NavItem = {
    href: ROLE_HOME[role],
    label: "Dashboard",
    icon: <LayoutDashboard className="size-4" />,
  };

  if (role === "ADMIN") {
    return [
      dashboard,
      { href: "/admin/employees", label: "Employees", icon: <Users className="size-4" /> },
      { href: "/admin/cycles", label: "All Cycles", icon: <ClipboardList className="size-4" /> },
      { href: "/admin/slabs", label: "Increment Slabs", icon: <Layers className="size-4" /> },
      { href: "/admin/extensions", label: "Extensions", icon: <Settings className="size-4" /> },
      { href: "/admin/salary-sheet", label: "Salary Sheet", icon: <BarChart3 className="size-4" /> },
      { href: "/employee", label: "My Appraisal", icon: <UserCheck className="size-4" /> },
      { href: "/history", label: "History", icon: <History className="size-4" /> },
    ];
  }
  if (role === "MANAGEMENT") {
    return [
      dashboard,
      { href: "/management/salary", label: "Salary Calculator", icon: <BarChart3 className="size-4" /> },
      { href: "/history", label: "History", icon: <History className="size-4" /> },
    ];
  }
  if (role === "HR" || role === "TL" || role === "MANAGER") {
    return [
      { href: "/reviewer", label: "My Reviews", icon: <Star className="size-4" /> },
      { href: "/employee", label: "My Appraisal", icon: <UserCheck className="size-4" /> },
      { href: "/history", label: "History", icon: <History className="size-4" /> },
    ];
  }
  if (role === "EMPLOYEE") {
    return [
      dashboard,
      { href: "/history", label: "History", icon: <History className="size-4" /> },
    ];
  }
  if (role === "PARTNER") {
    return [
      { href: "/partner", label: "Partner View", icon: <Building2 className="size-4" /> },
    ];
  }
  return [dashboard, { href: "/history", label: "History", icon: <History className="size-4" /> }];
}

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) return null;
  const { id, name, role } = session.user;
  const nav = navFor(role);

  const unread = await prisma.notification.count({
    where: { userId: id, read: false },
  });

  const roleColors: Record<Role, string> = {
    ADMIN: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    MANAGEMENT: "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
    MANAGER: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
    HR: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
    TL: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    EMPLOYEE: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    PARTNER: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  };

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      <aside className="w-60 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col shadow-sm sticky top-0 h-screen overflow-y-auto">
        <div className="px-5 py-5 border-b border-slate-100 dark:border-slate-800">
          <Link href={ROLE_HOME[role]} className="font-bold text-slate-900 dark:text-white block text-base">
            Adarsh Shipping
          </Link>
          <p className="text-xs text-slate-400 mt-0.5">Appraisal Portal</p>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 text-sm overflow-y-auto">
          {nav.map((n) => (
            <Link
              key={n.href + n.label}
              href={n.href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
            >
              {n.icon}
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="flex items-center gap-2">
            <div className="size-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300 shrink-0">
              {name?.charAt(0)?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">{name}</div>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${roleColors[role]}`}>
                {role}
              </span>
            </div>
            {unread > 0 && (
              <Link href="/notifications" className="ml-auto relative">
                <Bell className="size-4 text-slate-500" />
                <span className="absolute -top-1 -right-1 size-3.5 bg-red-500 rounded-full text-[8px] text-white flex items-center justify-center font-bold">
                  {unread > 9 ? "9+" : unread}
                </span>
              </Link>
            )}
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="w-full text-xs h-8 border-slate-200 dark:border-slate-700"
            >
              <LogOut className="size-3 mr-1.5" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
