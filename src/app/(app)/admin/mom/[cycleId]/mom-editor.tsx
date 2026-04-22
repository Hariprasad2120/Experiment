"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveMomAction } from "./actions";
import { FileText, Save } from "lucide-react";

export function MomEditor({
  cycleId,
  existingContent,
  isNew,
}: {
  cycleId: string;
  existingContent: string;
  isNew: boolean;
}) {
  const [content, setContent] = useState(existingContent);
  const [pending, startTransition] = useTransition();

  function save() {
    startTransition(async () => {
      const res = await saveMomAction({ cycleId, content });
      if (!res.ok) { toast.error(res.error); return; }
      toast.success(isNew ? "MOM created and published" : "MOM updated");
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <FileText className="size-4" />
        <span>{isNew ? "Draft new MOM" : "Edit MOM"} — visible to all parties once saved</span>
      </div>
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={18}
        className="font-mono text-sm resize-y"
      />
      <Button onClick={save} disabled={pending} className="flex items-center gap-2">
        <Save className="size-4" />
        {pending ? "Saving..." : isNew ? "Publish MOM" : "Update MOM"}
      </Button>
    </div>
  );
}
