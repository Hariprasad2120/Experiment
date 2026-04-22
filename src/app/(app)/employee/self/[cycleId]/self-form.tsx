"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitSelfAction } from "./actions";

export function SelfForm({
  cycleId,
  questions,
  existing,
  editableUntil,
}: {
  cycleId: string;
  questions: string[];
  existing: Record<string, string>;
  editableUntil: string;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(() =>
    Object.fromEntries(questions.map((q) => [q, existing[q] ?? ""])),
  );
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function submit() {
    if (Object.values(answers).some((a) => !a.trim())) {
      toast.error("Answer all questions");
      return;
    }
    startTransition(async () => {
      const res = await submitSelfAction({ cycleId, answers });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Submitted");
      router.push("/employee");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Editable until {new Date(editableUntil).toLocaleString()} (3 business days).
      </p>
      {questions.map((q) => (
        <div key={q}>
          <label className="text-sm font-medium mb-1 block">{q}</label>
          <Textarea
            value={answers[q]}
            onChange={(e) => setAnswers((p) => ({ ...p, [q]: e.target.value }))}
            rows={3}
          />
        </div>
      ))}
      <Button onClick={submit} disabled={pending}>
        {pending ? "Submitting..." : "Submit"}
      </Button>
    </div>
  );
}
