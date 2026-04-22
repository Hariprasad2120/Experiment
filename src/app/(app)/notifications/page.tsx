import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn, StaggerList, StaggerItem } from "@/components/motion-div";
import Link from "next/link";
import { Bell, CheckCircle } from "lucide-react";
import { markAllReadAction } from "./actions";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user) return null;

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unread = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-5 max-w-2xl">
      <FadeIn>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bell className="size-5" /> Notifications
            </h1>
            <p className="text-slate-500 text-sm mt-1">{unread} unread</p>
          </div>
          {unread > 0 && (
            <form action={markAllReadAction}>
              <input type="hidden" name="userId" value={session.user.id} />
              <button
                type="submit"
                className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
              >
                <CheckCircle className="size-3.5" /> Mark all read
              </button>
            </form>
          )}
        </div>
      </FadeIn>

      <StaggerList className="space-y-2">
        {notifications.length === 0 && (
          <StaggerItem>
            <Card className="border-0 shadow-sm">
              <CardContent className="py-10 text-center text-slate-400">
                No notifications yet.
              </CardContent>
            </Card>
          </StaggerItem>
        )}
        {notifications.map((n) => (
          <StaggerItem key={n.id}>
            <div className={`rounded-xl border px-4 py-3 transition-colors ${
              n.read
                ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
                : "bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800"
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <p className={`text-sm ${n.read ? "text-slate-600 dark:text-slate-400" : "text-slate-900 dark:text-white font-medium"}`}>
                    {n.message}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{n.createdAt.toLocaleString()}</p>
                </div>
                {!n.read && <span className="size-2 bg-blue-500 rounded-full shrink-0 mt-1.5" />}
              </div>
              {n.link && (
                <Link href={n.link} className="text-xs text-blue-600 hover:text-blue-700 mt-1 inline-block">
                  View →
                </Link>
              )}
            </div>
          </StaggerItem>
        ))}
      </StaggerList>
    </div>
  );
}
