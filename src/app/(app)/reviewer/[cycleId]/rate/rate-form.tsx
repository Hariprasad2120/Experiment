"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitRatingAction } from "./actions";
import { motion, AnimatePresence } from "motion/react";
import { Info } from "lucide-react";

type Score = number | "AVERAGE_OUT";

export function RateForm({
  cycleId,
  role,
  criteria,
  peerRatingExists,
}: {
  cycleId: string;
  role: "HR" | "TL" | "MANAGER";
  criteria: string[];
  peerRatingExists: boolean;
}) {
  const [scores, setScores] = useState<Record<string, Score>>(
    Object.fromEntries(criteria.map((c) => [c, 3])),
  );
  const [comments, setComments] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const isTL = role === "TL";

  function setScore(criterion: string, value: Score) {
    if (value === "AVERAGE_OUT") {
      if (isTL) { toast.error("TLs cannot use Average Out"); return; }
      if (!peerRatingExists) { toast.error("Average Out requires at least one peer to have already rated this item"); return; }
    }
    setScores((prev) => ({ ...prev, [criterion]: value }));
  }

  function submit() {
    if (!comments.trim()) { toast.error("Comments are required"); return; }
    const hasAO = Object.values(scores).some((s) => s === "AVERAGE_OUT");
    if (hasAO && !peerRatingExists) {
      toast.error("Cannot use Average Out — no peer has rated yet");
      return;
    }
    startTransition(async () => {
      const numericScores = Object.fromEntries(
        Object.entries(scores).map(([k, v]) => [k, v === "AVERAGE_OUT" ? -1 : v]),
      );
      const res = await submitRatingAction({ cycleId, role, scores: numericScores, comments, hasAverageOut: hasAO });
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Rating submitted — thank you!");
      router.push(`/reviewer/${cycleId}`);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-5">
        {criteria.map((c, idx) => {
          const score = scores[c];
          const isAO = score === "AVERAGE_OUT";
          return (
            <motion.div
              key={c}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-900 dark:text-white">{c}</label>
                <div className="flex items-center gap-3">
                  {!isTL && peerRatingExists && (
                    <button
                      type="button"
                      onClick={() => setScore(c, isAO ? 3 : "AVERAGE_OUT")}
                      className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                        isAO
                          ? "bg-amber-100 text-amber-700 border-amber-300"
                          : "text-slate-400 border-slate-200 hover:border-amber-300 hover:text-amber-600"
                      }`}
                    >
                      {isAO ? "✓ Averaged Out" : "Average Out"}
                    </button>
                  )}
                  {!isAO && (
                    <span className="text-lg font-bold text-slate-700 dark:text-slate-200 w-6 text-center">
                      {score}
                    </span>
                  )}
                </div>
              </div>

              {!isAO && (
                <>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={score as number}
                    onChange={(e) => setScore(c, Number(e.target.value))}
                    className="w-full accent-blue-600 h-2"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <span key={n} className={score === n ? "text-blue-600 font-bold" : ""}>{n}</span>
                    ))}
                  </div>
                </>
              )}
              {isAO && (
                <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2">
                  Will be averaged with peer scores after all reviewers submit.
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 space-y-2">
        <label className="text-sm font-semibold text-slate-900 dark:text-white">Comments</label>
        <Textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={4}
          placeholder="Add your overall assessment and feedback..."
          className="resize-none"
        />
      </div>

      {isTL && (
        <div className="flex gap-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg p-3">
          <Info className="size-3.5 shrink-0 mt-0.5" />
          As TL, Average Out is not available to you.
        </div>
      )}

      <Button onClick={submit} disabled={pending} className="w-full h-11">
        {pending ? "Submitting..." : "Submit Rating"}
      </Button>
      <p className="text-xs text-slate-400 text-center">
        Ratings are locked after submission. You may add post-submission comments later.
      </p>
    </div>
  );
}
