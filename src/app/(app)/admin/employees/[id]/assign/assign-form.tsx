"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { assignReviewersAction, startSpecialAppraisalAction } from "./actions";
import { Users, CheckCircle, Zap, Info } from "lucide-react";

type Opt = { id: string; name: string };

type Props = {
  employeeId: string;
  employeeName: string;
  existingCycleId: string | null;
  existingCycleType: string | null;
  existingAssignments: { role: string; reviewerId: string }[];
  autoType: string;        // determined by system ("ANNUAL" | "INTERIM")
  autoReason: string;      // human-readable reason
  eligible: boolean;       // is this employee at a milestone this month?
  hrUsers: Opt[];
  tlUsers: Opt[];
  mgrUsers: Opt[];
};

export function AssignForm(props: Props) {
  const initial = (role: string) =>
    props.existingAssignments.find((a) => a.role === role)?.reviewerId ?? "";

  const [hr, setHr] = useState(initial("HR"));
  const [tl, setTl] = useState(initial("TL"));
  const [mgr, setMgr] = useState(initial("MANAGER"));
  const [pending, startTransition] = useTransition();

  // Special appraisal state
  const [specialHr, setSpecialHr] = useState("");
  const [specialTl, setSpecialTl] = useState("");
  const [specialMgr, setSpecialMgr] = useState("");
  const [specialPending, startSpecialTransition] = useTransition();

  const hasActive = !!props.existingCycleId;
  const allSet = hr && tl && mgr;
  const specialAllSet = specialHr && specialTl && specialMgr;

  function submit() {
    if (!hr || !tl || !mgr) { toast.error("All three reviewers required"); return; }
    startTransition(async () => {
      const res = await assignReviewersAction({ employeeId: props.employeeId, hrId: hr, tlId: tl, mgrId: mgr });
      if (res.ok) toast.success("Reviewers assigned — emails sent");
      else toast.error(res.error ?? "Failed");
    });
  }

  function submitSpecial() {
    if (!specialHr || !specialTl || !specialMgr) { toast.error("All three reviewers required"); return; }
    startSpecialTransition(async () => {
      const res = await startSpecialAppraisalAction({ employeeId: props.employeeId, hrId: specialHr, tlId: specialTl, mgrId: specialMgr });
      if (res.ok) toast.success("Special appraisal started — emails sent");
      else toast.error(res.error ?? "Failed");
    });
  }

  return (
    <div className="space-y-4">
      {/* Standard cycle — assign reviewers */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="size-4" />
            {hasActive ? "Update Reviewer Assignments" : "Assign Reviewers"}
          </CardTitle>

          {/* Eligibility pill */}
          <div className={`flex items-start gap-2 text-xs rounded-lg px-3 py-2 mt-1 ${
            props.eligible
              ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400"
              : "bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500"
          }`}>
            <Info className="size-3.5 shrink-0 mt-0.5" />
            <div>
              {hasActive ? (
                <span>Active cycle: <strong>{props.existingCycleType}</strong> — updating assignments</span>
              ) : props.eligible ? (
                <span>System determined: <strong>{props.autoType} Appraisal</strong> — {props.autoReason}</span>
              ) : (
                <span>No milestone due this month. You can still assign — type auto-set to <strong>{props.autoType}</strong> based on tenure.</span>
              )}
            </div>
          </div>

          {hasActive && (
            <p className="text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2 mt-1">
              Reassigning a reviewer resets their availability to PENDING.
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ReviewerPicker label="HR Reviewer" color="bg-green-500" value={hr} onChange={setHr} options={props.hrUsers} />
            <ReviewerPicker label="TL Reviewer" color="bg-amber-500" value={tl} onChange={setTl} options={props.tlUsers} />
            <ReviewerPicker label="Manager Reviewer" color="bg-blue-500" value={mgr} onChange={setMgr} options={props.mgrUsers} />
          </div>

          {allSet && (
            <div className="flex flex-wrap gap-3 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
              <span className="flex items-center gap-1"><CheckCircle className="size-3 text-green-500" /> HR: {props.hrUsers.find((u) => u.id === hr)?.name}</span>
              <span className="flex items-center gap-1"><CheckCircle className="size-3 text-amber-500" /> TL: {props.tlUsers.find((u) => u.id === tl)?.name}</span>
              <span className="flex items-center gap-1"><CheckCircle className="size-3 text-blue-500" /> MGR: {props.mgrUsers.find((u) => u.id === mgr)?.name}</span>
            </div>
          )}

          <Button onClick={submit} disabled={pending || !allSet} className="h-10">
            {pending ? "Saving..." : hasActive ? "Update Assignments" : "Assign Reviewers"}
          </Button>
        </CardContent>
      </Card>

      {/* Special appraisal — only when no active cycle */}
      {!hasActive && (
        <Card className="border-0 shadow-sm border-l-4 border-l-purple-400">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-purple-700 dark:text-purple-400">
              <Zap className="size-4" />
              Start Special Appraisal
            </CardTitle>
            <p className="text-xs text-slate-500 mt-0.5">
              Admin-only. Outside normal milestone schedule. Creates a SPECIAL cycle immediately.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <ReviewerPicker label="HR Reviewer" color="bg-green-500" value={specialHr} onChange={setSpecialHr} options={props.hrUsers} />
              <ReviewerPicker label="TL Reviewer" color="bg-amber-500" value={specialTl} onChange={setSpecialTl} options={props.tlUsers} />
              <ReviewerPicker label="Manager Reviewer" color="bg-blue-500" value={specialMgr} onChange={setSpecialMgr} options={props.mgrUsers} />
            </div>

            {specialAllSet && (
              <div className="flex flex-wrap gap-3 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                <span className="flex items-center gap-1"><CheckCircle className="size-3 text-green-500" /> HR: {props.hrUsers.find((u) => u.id === specialHr)?.name}</span>
                <span className="flex items-center gap-1"><CheckCircle className="size-3 text-amber-500" /> TL: {props.tlUsers.find((u) => u.id === specialTl)?.name}</span>
                <span className="flex items-center gap-1"><CheckCircle className="size-3 text-blue-500" /> MGR: {props.mgrUsers.find((u) => u.id === specialMgr)?.name}</span>
              </div>
            )}

            <Button
              onClick={submitSpecial}
              disabled={specialPending || !specialAllSet}
              className="h-10 bg-purple-600 hover:bg-purple-700"
            >
              {specialPending ? "Starting..." : "Start Special Appraisal"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ReviewerPicker({ label, color, value, onChange, options }: {
  label: string; color: string; value: string; onChange: (v: string) => void; options: Opt[];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5">
        <span className={`size-2 rounded-full inline-block ${color}`} />
        {label}
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={`Select ${label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 && (
            <SelectItem value="__none__" disabled>No users found</SelectItem>
          )}
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
