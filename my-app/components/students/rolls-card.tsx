"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { Alert, Field } from "@/components/form";
import { Card, EmptyState, Loading } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { changeStudentRoll, getStudentRolls, type StudentRoll } from "@/lib/students";
import { emptyToNull, getErrorMessage } from "@/lib/utils";

/** Roll numbers per enrollment and roll type, with an audited change form. */
export default function RollsCard({ studentId, canManage }: { studentId: string; canManage: boolean }) {
  const lookup = useAcademicLookup();
  const rolls = useQuery(`rolls:${studentId}`, () => getStudentRolls(studentId));
  const [editing, setEditing] = useState<{ key: string; enrollmentId: string; rollType: string; value: string; reason: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const keyOf = (r: StudentRoll, i: number) => getId(r) || `${r.enrollment_id}:${r.roll_type}:${i}`;

  const save = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    setBusy(true); setError("");
    try {
      await changeStudentRoll(editing.enrollmentId, { roll_type: editing.rollType, value: emptyToNull(editing.value), reason: editing.reason.trim() });
      setEditing(null); rolls.reload();
    } catch (err) { setError(getErrorMessage(err, "Could not change roll number")); }
    finally { setBusy(false); }
  };

  return (
    <Card title="Roll numbers">
      <div className="space-y-3">
        {(error || rolls.error) && <Alert type="error">{error || rolls.error}</Alert>}
        {rolls.loading || lookup.loading ? <Loading /> : (rolls.data?.length ?? 0) === 0 ? <EmptyState>No roll numbers assigned.</EmptyState> : (
          <ul className="divide-y rounded-md border text-sm">
            {rolls.data!.map((r, i) => {
              const key = keyOf(r, i);
              const where = [r.class_id && lookup.className(r.class_id), r.section_id && `Section ${lookup.sectionName(r.section_id)}`, r.academic_year_id && lookup.yearName(r.academic_year_id)].filter(Boolean).join(" · ");
              if (editing?.key === key) {
                return (
                  <li key={key} className="p-3">
                    <form onSubmit={save} className="flex flex-wrap items-end gap-2">
                      <Field label="Roll" htmlFor="roll-value" className="w-24">
                        <Input id="roll-value" maxLength={64} value={editing.value} onChange={(e) => setEditing({ ...editing, value: e.target.value })} />
                      </Field>
                      <Field label="Reason" htmlFor="roll-change-reason" required className="min-w-48 flex-1">
                        <Input id="roll-change-reason" required minLength={3} maxLength={500} value={editing.reason} onChange={(e) => setEditing({ ...editing, reason: e.target.value })} />
                      </Field>
                      <Button type="submit" disabled={busy}>Save</Button>
                      <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                    </form>
                  </li>
                );
              }
              return (
                <li key={key} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <div>
                    <p className="font-medium">{r.value ?? "—"} <span className="font-mono text-xs text-muted-foreground">{r.roll_type}</span></p>
                    {where && <p className="text-xs text-muted-foreground">{where}</p>}
                  </div>
                  {canManage && r.enrollment_id && r.roll_type && (
                    <Button size="sm" variant="outline" onClick={() => setEditing({ key, enrollmentId: r.enrollment_id!, rollType: r.roll_type!, value: r.value ?? "", reason: "" })}>Change</Button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
