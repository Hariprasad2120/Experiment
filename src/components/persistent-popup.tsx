"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Bell, AlertTriangle, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type PopupNotification = {
  id: string;
  type: string;
  message: string;
  link: string | null;
  createdAt: string;
};

type Props = {
  initialNotifications: PopupNotification[];
};

const iconByType: Record<string, React.ReactNode> = {
  ASSIGNMENT: <Bell className="size-5 text-[#00cec4]" />,
  REASSIGN_NEEDED: <AlertTriangle className="size-5 text-[#ff8333]" />,
  NOT_AVAILABLE_ALERT: <AlertTriangle className="size-5 text-red-500" />,
  RATING_REMINDER: <Bell className="size-5 text-[#ffaa2d]" />,
  EXTENSION_REQUEST: <AlertTriangle className="size-5 text-purple-500" />,
  REVIEW_WINDOW_OPEN: <CheckCircle className="size-5 text-green-500" />,
};

export function PersistentPopup({ initialNotifications }: Props) {
  const [queue, setQueue] = useState<PopupNotification[]>(initialNotifications);
  const [dismissing, setDismissing] = useState<string | null>(null);

  const current = queue[0] ?? null;

  const dismiss = useCallback(async (id: string) => {
    setDismissing(id);
    try {
      await fetch("/api/notifications/dismiss", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch {
      // silent — notification still removed from UI
    }
    setQueue((prev) => prev.filter((n) => n.id !== id));
    setDismissing(null);
  }, []);

  // Re-poll every 30s for new persistent notifications
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/notifications/persistent");
        if (res.ok) {
          const data = await res.json() as PopupNotification[];
          setQueue((prev) => {
            const existingIds = new Set(prev.map((n) => n.id));
            const newOnes = data.filter((n) => !existingIds.has(n.id));
            return [...prev, ...newOnes];
          });
        }
      } catch {
        // silent
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-[#0d1117] border border-[#00cec4]/30 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-md mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/10">
              {iconByType[current.type] ?? <Bell className="size-5 text-[#00cec4]" />}
              <span className="font-semibold text-white flex-1">Action Required</span>
              <span className="text-[10px] text-white/40 tabular-nums">
                {queue.length > 1 ? `1 of ${queue.length}` : ""}
              </span>
            </div>

            {/* Body */}
            <div className="px-5 py-5">
              <p className="text-sm text-white/80 leading-relaxed">{current.message}</p>
              {current.link && (
                <Link
                  href={current.link}
                  className="inline-flex items-center gap-1.5 mt-3 text-xs text-[#00cec4] hover:text-[#008993] font-medium transition-colors"
                  onClick={() => dismiss(current.id)}
                >
                  View details →
                </Link>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 pb-5 flex gap-3">
              <Button
                onClick={() => dismiss(current.id)}
                disabled={dismissing === current.id}
                className="flex-1 bg-[#00cec4] hover:bg-[#008993] text-black font-semibold h-10"
              >
                {dismissing === current.id ? "Dismissing..." : "Dismiss"}
              </Button>
              {queue.length > 1 && (
                <span className="self-center text-xs text-white/40">
                  {queue.length - 1} more pending
                </span>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
