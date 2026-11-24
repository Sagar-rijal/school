"use client";

import { EmptyState, Loading } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import type { RosterEntry } from "@/lib/types/student";
import { studentLabel } from "@/lib/students";

/** Checkbox list of a class roster, with select all/none. */
export default function RosterChecklist({
  roster,
  loading,
  selected,
  onChange,
  max,
}: {
  roster?: RosterEntry[];
  loading: boolean;
  selected: Set<string>;
  onChange: (next: Set<string>) => void;
  max?: number;
}) {
  if (loading) return <Loading />;
  if (!roster) return <EmptyState>Select a class and section to list students.</EmptyState>;
  if (roster.length === 0) return <EmptyState>No students in this class.</EmptyState>;

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted-foreground">
          {selected.size} of {roster.length} selected{max && selected.size > max ? ` (max ${max})` : ""}
        </span>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange(new Set(roster.slice(0, max).map((r) => r.studentId)))}>Select all</Button>
        <Button type="button" size="sm" variant="outline" onClick={() => onChange(new Set())}>Clear</Button>
      </div>
      <ul className="grid max-h-72 gap-1 overflow-y-auto rounded-md border p-2 sm:grid-cols-2">
        {roster.map((r) => (
          <li key={r.studentId}>
            <label className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-accent">
              <input type="checkbox" checked={selected.has(r.studentId)} onChange={() => toggle(r.studentId)} />
              {r.rollNumber && <span className="w-8 tabular-nums text-muted-foreground">{r.rollNumber}</span>}
              <span>{studentLabel(r.student)}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
