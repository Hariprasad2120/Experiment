"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "motion/react";
import { finalizeDecisionAction } from "./actions";
import { TrendingUp } from "lucide-react";

type Slab = { id: string; label: string; hikePercent: number; minRating: number; maxRating: number };

export function DecisionForm({
  cycleId,
  avgRating,
  slabs,
  suggestedSlabId,
  suggestedAmount,
  grossAnnum,
}: {
  cycleId: string;
  avgRating: number;
  slabs: Slab[];
  suggestedSlabId: string | null;
  suggestedAmount: number;
  grossAnnum: number;
}) {
  const [selectedSlabId, setSelectedSlabId] = useState(suggestedSlabId ?? "");
  const [finalRating, setFinalRating] = useState(avgRating.toFixed(2));
  const [finalAmount, setFinalAmount] = useState(suggestedAmount.toString());
  const [comments, setComments] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const selectedSlab = slabs.find((s) => s.id === selectedSlabId);
  const suggestedIncrement = selectedSlab ? Math.round(grossAnnum * selectedSlab.hikePercent / 100) : 0;

  function onSlabChange(slabId: string) {
    setSelectedSlabId(slabId);
    const slab = slabs.find((s) => s.id === slabId);
    if (slab) setFinalAmount(Math.round(grossAnnum * slab.hikePercent / 100).toString());
  }

  function submit() {
    startTransition(async () => {
      const res = await finalizeDecisionAction({
        cycleId,
        finalRating: parseFloat(finalRating),
        slabId: selectedSlabId || undefined,
        finalAmount: parseFloat(finalAmount),
        comments: comments || undefined,
      });
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Appraisal decision recorded");
      router.push("/management");
      router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Final Rating</Label>
          <Input
            type="number"
            step="0.01"
            min="0"
            max="5"
            value={finalRating}
            onChange={(e) => setFinalRating(e.target.value)}
            className="mt-1"
          />
          <p className="text-xs text-slate-400 mt-1">Average: {avgRating.toFixed(2)}</p>
        </div>
        <div>
          <Label>Increment Slab</Label>
          <select
            value={selectedSlabId}
            onChange={(e) => onSlabChange(e.target.value)}
            className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select slab</option>
            {slabs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label} ({s.hikePercent}%) — {s.minRating}–{s.maxRating}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedSlab && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg p-3 flex items-center gap-3"
        >
          <TrendingUp className="size-4 text-green-600 shrink-0" />
          <div className="text-sm">
            <span className="font-medium text-green-700 dark:text-green-400">{selectedSlab.label}</span>
            <span className="text-green-600"> — {selectedSlab.hikePercent}% hike = </span>
            <span className="font-bold text-green-700 dark:text-green-400">+₹{suggestedIncrement.toLocaleString()}/yr</span>
          </div>
        </motion.div>
      )}

      <div>
        <Label>Final Increment Amount (₹/yr)</Label>
        <Input
          type="number"
          value={finalAmount}
          onChange={(e) => setFinalAmount(e.target.value)}
          className="mt-1"
          placeholder="Override if needed"
        />
      </div>

      <div>
        <Label>Comments (optional)</Label>
        <Textarea
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          rows={3}
          className="mt-1"
          placeholder="Notes on the decision..."
        />
      </div>

      <Button onClick={submit} disabled={pending || !selectedSlabId} className="w-full h-11">
        {pending ? "Recording..." : "Finalize Decision"}
      </Button>
    </div>
  );
}
