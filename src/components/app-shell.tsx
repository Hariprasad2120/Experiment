import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/enums";
import { LogOut, Bell } from "lucide-react";
import { SidebarNav } from "@/components/sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { PersistentPopup } from "@/components/persistent-popup";

const roleColors: Record<Role, string> = {
  ADMIN: "bg-[#ff8333]/15 text-[#ff8333]",
  MANAGEMENT: "bg-[#ffaa2d]/15 text-[#ffaa2d]",
  MANAGER: "bg-[#008993]/15 text-[#00cec4]",
  HR: "bg-[#00cec4]/15 text-[#00cec4]",
  TL: "bg-[#ffaa2d]/15 text-[#ffaa2d]",
  EMPLOYEE: "bg-black/8 dark:bg-white/8 text-[#aaa]",
  PARTNER: "bg-[#008993]/15 text-[#008993]",
};

export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) return null;
  const { id, name, role, secondaryRole } = session.user;

  const unread = await prisma.notification.count({
    where: { userId: id, read: false },
  });

  const persistentNotifications = await prisma.notification.findMany({
    where: { userId: id, persistent: true, dismissed: false },
    orderBy: { createdAt: "asc" },
    select: { id: true, type: true, message: true, link: true, createdAt: true },
  });

  const initial = name?.charAt(0)?.toUpperCase() ?? "?";

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-60 shrink-0 border-r border-border bg-sidebar flex flex-col sticky top-0 h-screen overflow-hidden">
        {/* Logo area */}
        <div className="px-5 py-5 border-b border-border">
          <Link
            href={ROLE_HOME[role]}
            className="block group"
          >
            <div className="font-bold text-foreground text-base tracking-tight group-hover:text-[#00cec4] transition-colors duration-200">
              Adarsh Shipping
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 font-medium tracking-wide uppercase">
              Appraisal Portal
            </p>
          </Link>
        </div>

        {/* Nav — client component with framer motion */}
        <SidebarNav role={role} secondaryRole={secondaryRole} />

        {/* User footer */}
        <div className="p-4 border-t border-border space-y-3">
          <div className="flex items-center gap-2.5">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="size-8 rounded-full bg-gradient-to-br from-[#008993] to-[#00cec4] flex items-center justify-center text-xs font-bold text-white shadow-[0_0_12px_rgba(0,137,147,0.4)]">
                {initial}
              </div>
            </div>

            {/* Name + role */}
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-foreground truncate">{name}</div>
              <span className={`inline-block mt-0.5 text-[10px] px-1.5 py-0.5 rounded font-medium ${roleColors[role]}`}>
                {role}
              </span>
            </div>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Notification bell */}
            {unread > 0 && (
              <Link href="/notifications" className="relative shrink-0 group">
                <Bell className="size-4 text-muted-foreground group-hover:text-[#ffaa2d] transition-colors duration-200" />
                <span className="absolute -top-1.5 -right-1.5 size-3.5 bg-[#ffaa2d] rounded-full text-[8px] text-black flex items-center justify-center font-bold leading-none">
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
              className="w-full text-xs h-8"
            >
              <LogOut className="size-3 mr-1.5" />
              Sign out
            </Button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto min-h-screen">{children}</main>

      {/* Persistent popup notifications — block until dismissed */}
      <PersistentPopup
        initialNotifications={persistentNotifications.map((n) => ({
          ...n,
          createdAt: n.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
