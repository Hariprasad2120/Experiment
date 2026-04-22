"use client";

import { useActionState } from "react";
import { createSlabAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SlabForm() {
  const [state, action, pending] = useActionState(
    async (_prev: unknown, fd: FormData) => {
      return createSlabAction(fd);
    },
    null,
  );

  return (
    <form action={action} className="space-y-4">
      <div>
        <Label>Label</Label>
        <Input name="label" placeholder="e.g. Excellent" className="mt-1" required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Min Rating</Label>
          <Input name="minRating" type="number" step="0.01" min="0" max="5" placeholder="0" className="mt-1" required />
        </div>
        <div>
          <Label>Max Rating</Label>
          <Input name="maxRating" type="number" step="0.01" min="0" max="5" placeholder="5" className="mt-1" required />
        </div>
      </div>
      <div>
        <Label>Hike %</Label>
        <Input name="hikePercent" type="number" step="0.1" min="0" max="100" placeholder="10" className="mt-1" required />
      </div>
      {state && !state.ok && (
        <p className="text-sm text-red-600">{state.error}</p>
      )}
      {state && state.ok && (
        <p className="text-sm text-green-600">Slab created.</p>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Saving..." : "Add Slab"}
      </Button>
    </form>
  );
}
