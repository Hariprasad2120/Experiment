"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { castVoteAction } from "./actions";

export function VoteForm({ cycleId }: { cycleId: string }) {
  const [date, setDate] = useState("");
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minStr = minDate.toISOString().split("T")[0];

  function submit() {
    if (!date) { toast.error("Select a date"); return; }
    startTransition(async () => {
      const res = await castVoteAction({ cycleId, date });
      if (!res.ok) { toast.error(res.error); return; }
      toast.success("Vote recorded!");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select preferred date</label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={minStr}
          className="mt-1 w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <Button onClick={submit} disabled={pending || !date} className="w-full">
        {pending ? "Voting..." : "Cast Vote"}
      </Button>
    </div>
  );
}
