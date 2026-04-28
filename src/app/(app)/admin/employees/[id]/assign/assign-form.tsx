"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { assignReviewersAction, startSpecialAppraisalAction } from "./actions";
import { Users, CheckCircle, Zap, Info, AlertTriangle } from "lucide-react";

type Opt = { id: string; name: string };

type Props = {
  employeeId: string;
  employeeName: string;
  existingCycleId: string | null;
  existingCycleType: string | null;
  existingCycleIsManagerCycle: boolean;
  existingAssignments: { role: string; reviewerId: string }[];
  autoType: string;
  autoReason: string;
  eligible: boolean;
  hrUsers: Opt[];
  tlUsers: Opt[];
  mgrUsers: Opt[];
  appraiseeId: string;
  employeeRole: string;
};

export function AssignForm(props: Props) {
  const { appraiseeId } = props;

  // MANAGER and HR appraisees: only Management+HR (no TL)
  // TL appraisee: Management+Manager+HR
  // All others: HR+TL+Manager
  const forceManagerCycle = props.employeeRole === "MANAGER" || props.employeeRole === "HR";
  const forceTLCycle = props.employeeRole === "TL";
  const isManagerRole = forceManagerCycle || forceTLCycle;
  const defaultManagerCycle = forceManagerCycle || props.existingCycleIsManagerCycle;

  const initial = (role: string) =>
    props.existingAssignments.find((a) => a.role === role)?.reviewerId ?? "";

  const [hr, setHr] = useState(initial("HR"));
  const [tl, setTl] = useState(initial("TL"));
  const [mgr, setMgr] = useState(initial("MANAGER"));
  const [isManagerCycle, setIsManagerCycle] = useState(defaultManagerCycle);
  const [pending, startTransition] = useTransition();

  // Special appraisal state
  const [specialHr, setSpecialHr] = useState("");
  const [specialTl, setSpecialTl] = useState("");
  const [specialMgr, setSpecialMgr] = useState("");
  const [specialIsManagerCycle, setSpecialIsManagerCycle] = useState(forceManagerCycle);
  const [specialPending, startSpecialTransition] = useTransition();

  const hasActive = !!props.existingCycleId;
  // For TL employees: all three slots (HR+TL+MGR) required, never manager cycle
  // For MANAGER/HR employees: only HR+MGR required, always manager cycle (no TL)
  const allSet = (forceManagerCycle || isManagerCycle) ? (hr && mgr) : (hr && tl && mgr);
  const specialAllSet = (forceManagerCycle || specialIsManagerCycle) ? (specialHr && specialMgr) : (specialHr && specialTl && specialMgr);

  const effectiveManagerCycle = forceManagerCycle || (isManagerCycle && !forceTLCycle);

  function submit() {
    if (!hr || !mgr) { toast.error("HR and Manager reviewers required"); return; }
    if (!effectiveManagerCycle && !tl) { toast.error("TL reviewer required for non-manager cycles"); return; }
    startTransition(async () => {
      const res = await assignReviewersAction({
        employeeId: props.employeeId,
        hrId: hr,
        tlId: effectiveManagerCycle ? undefined : tl,
        mgrId: mgr,
        isManagerCycle: effectiveManagerCycle,
      });
      if (res.ok) toast.success("Reviewers assigned — notifications sent");
      else toast.error(res.error ?? "Failed");
    });
  }

  const effectiveSpecialManagerCycle = forceManagerCycle || (specialIsManagerCycle && !forceTLCycle);

  function submitSpecial() {
    if (!specialHr || !specialMgr) { toast.error("HR and Manager reviewers required"); return; }
    if (!effectiveSpecialManagerCycle && !specialTl) { toast.error("TL reviewer required for non-manager cycles"); return; }
    startSpecialTransition(async () => {
      const res = await startSpecialAppraisalAction({
        employeeId: props.employeeId,
        hrId: specialHr,
        tlId: effectiveSpecialManagerCycle ? undefined : specialTl,
        mgrId: specialMgr,
        isManagerCycle: effectiveSpecialManagerCycle,
      });
      if (res.ok) toast.success("Special appraisal started — notifications sent");
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
          {/* Manager cycle toggle */}
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div
              className={`relative w-10 h-5 rounded-full transition-colors ${(forceManagerCycle || isManagerCycle) ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-600"} ${forceManagerCycle || forceTLCycle ? "opacity-60 cursor-not-allowed" : ""}`}
              onClick={() => { if (!forceManagerCycle && !forceTLCycle) setIsManagerCycle((v) => !v); }}
            >
              <span className={`absolute top-0.5 left-0.5 size-4 bg-white rounded-full shadow transition-transform ${(forceManagerCycle || isManagerCycle) ? "translate-x-5" : ""}`} />
            </div>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <AlertTriangle className="size-3 text-purple-500" />
              Manager Cycle
              {forceManagerCycle && <span className="text-purple-500 font-normal">(locked — {props.employeeRole} appraisees rated by Management + HR only)</span>}
              {forceTLCycle && <span className="text-amber-500 font-normal">(locked — TL appraisees rated by Management + Manager + HR)</span>}
              {!forceManagerCycle && !forceTLCycle && <span className="text-slate-400 font-normal">(no TL — MANAGEMENT rates instead)</span>}
            </span>
          </label>

          <div className={`grid grid-cols-1 gap-4 ${(forceManagerCycle || (isManagerCycle && !forceTLCycle)) ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
            <ReviewerPicker label="HR Reviewer" color="bg-green-500" value={hr} onChange={setHr} options={props.hrUsers} appraiseeId={appraiseeId} />
            {(forceTLCycle || (!forceManagerCycle && !isManagerCycle)) && (
              <ReviewerPicker label="TL Reviewer" color="bg-amber-500" value={tl} onChange={setTl} options={props.tlUsers} appraiseeId={appraiseeId} />
            )}
            <ReviewerPicker label="Manager Reviewer" color="bg-blue-500" value={mgr} onChange={setMgr} options={props.mgrUsers} appraiseeId={appraiseeId} />
          </div>

          {(forceManagerCycle || (isManagerCycle && !forceTLCycle)) && (
            <p className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-lg px-3 py-2">
              {forceManagerCycle
                ? `${props.employeeRole} appraisal: HR confirms availability, MANAGEMENT team provides the final rating.`
                : "Manager cycle: HR confirms availability, then MANAGEMENT team provides the final rating."}
            </p>
          )}

          {allSet && (
            <div className="flex flex-wrap gap-3 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
              <span className="flex items-center gap-1"><CheckCircle className="size-3 text-green-500" /> HR: {props.hrUsers.find((u) => u.id === hr)?.name}</span>
              {!isManagerCycle && tl && <span className="flex items-center gap-1"><CheckCircle className="size-3 text-amber-500" /> TL: {props.tlUsers.find((u) => u.id === tl)?.name}</span>}
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
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                className={`relative w-10 h-5 rounded-full transition-colors ${effectiveSpecialManagerCycle ? "bg-purple-600" : "bg-slate-300 dark:bg-slate-600"} ${forceManagerCycle || forceTLCycle ? "opacity-60 cursor-not-allowed" : ""}`}
                onClick={() => { if (!forceManagerCycle && !forceTLCycle) setSpecialIsManagerCycle((v) => !v); }}
              >
                <span className={`absolute top-0.5 left-0.5 size-4 bg-white rounded-full shadow transition-transform ${effectiveSpecialManagerCycle ? "translate-x-5" : ""}`} />
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <AlertTriangle className="size-3 text-purple-500" />
                Manager Cycle
                {forceManagerCycle && <span className="text-purple-500 font-normal">(locked — {props.employeeRole} appraisees rated by Management + HR only)</span>}
                {forceTLCycle && <span className="text-amber-500 font-normal">(locked — TL appraisees rated by Management + Manager + HR)</span>}
                {!forceManagerCycle && !forceTLCycle && <span className="text-slate-400 font-normal">(no TL — MANAGEMENT rates instead)</span>}
              </span>
            </label>

            <div className={`grid grid-cols-1 gap-4 ${effectiveSpecialManagerCycle ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
              <ReviewerPicker label="HR Reviewer" color="bg-green-500" value={specialHr} onChange={setSpecialHr} options={props.hrUsers} appraiseeId={appraiseeId} />
              {(forceTLCycle || (!forceManagerCycle && !specialIsManagerCycle)) && (
                <ReviewerPicker label="TL Reviewer" color="bg-amber-500" value={specialTl} onChange={setSpecialTl} options={props.tlUsers} appraiseeId={appraiseeId} />
              )}
              <ReviewerPicker label="Manager Reviewer" color="bg-blue-500" value={specialMgr} onChange={setSpecialMgr} options={props.mgrUsers} appraiseeId={appraiseeId} />
            </div>

            {specialAllSet && (
              <div className="flex flex-wrap gap-3 text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 rounded-lg px-3 py-2">
                <span className="flex items-center gap-1"><CheckCircle className="size-3 text-green-500" /> HR: {props.hrUsers.find((u) => u.id === specialHr)?.name}</span>
                {!specialIsManagerCycle && specialTl && <span className="flex items-center gap-1"><CheckCircle className="size-3 text-amber-500" /> TL: {props.tlUsers.find((u) => u.id === specialTl)?.name}</span>}
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

function ReviewerPicker({ label, color, value, onChange, options, appraiseeId }: {
  label: string; color: string; value: string; onChange: (v: string) => void; options: Opt[]; appraiseeId: string;
}) {
  const selectedName = options.find((o) => o.id === value)?.name;
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5">
        <span className={`size-2 rounded-full inline-block ${color}`} />
        {label}
      </Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger className="w-full">
          {selectedName ? (
            <span>{selectedName}</span>
          ) : (
            <SelectValue placeholder={`Select ${label}`} />
          )}
        </SelectTrigger>
        <SelectContent>
          {options.length === 0 && (
            <SelectItem value="__none__" disabled>No users found</SelectItem>
          )}
          {options.map((o) => {
            const isSelf = o.id === appraiseeId;
            return (
              <SelectItem key={o.id} value={o.id} disabled={isSelf} className={isSelf ? "opacity-40" : undefined}>
                {o.name}{isSelf ? " (appraisee)" : ""}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
