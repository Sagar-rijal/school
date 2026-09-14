"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field, Select } from "@/components/form";
import { Card, EmptyState, Loading, StatusBadge } from "@/components/data-display";
import ClassSectionPicker, { type ClassSectionValue } from "@/components/class-section-picker";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { enrollStudent, getEnrollmentHistory, updateEnrollment } from "@/lib/students";
import { ENROLLMENT_STATUS_TONES, ENROLLMENT_STATUSES, type Enrollment, type EnrollmentStatus } from "@/lib/types/student";
import { byDisplayOrder, emptyToNull, formatEnum, getErrorMessage } from "@/lib/utils";

export default function EnrollmentsPanel({ studentId }: { studentId: string }) {
  const lookup = useAcademicLookup();
  const { years, defaultYearId } = useAcademicYears();
  const history = useQuery(`enrollments:${studentId}`, () => getEnrollmentHistory(studentId));

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // New enrollment
  const [showEnroll, setShowEnroll] = useState(false);
  const [target, setTarget] = useState<ClassSectionValue>({ year: "", class: "", section: "" });
  const [roll, setRoll] = useState("");
  const targetValue = { ...target, year: target.year || defaultYearId };

  // Editing an enrollment
  const [editing, setEditing] = useState<{ id: string; year: string; class: string; section: string; roll: string; status: EnrollmentStatus } | null>(null);

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setBusy(true);
    setError("");
    try {
      await action();
      history.reload();
      return true;
    } catch (err) {
      setError(getErrorMessage(err, fallback));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleEnroll = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!targetValue.class || !targetValue.section) {
      setError("Select a class and section.");
      return;
    }
    const ok = await run(
      () =>
        enrollStudent({
          student_id: studentId,
          academic_year_id: targetValue.year,
          class_id: targetValue.class,
          section_id: targetValue.section,
          roll_number: emptyToNull(roll),
        }),
      "Failed to enroll student"
    );
    if (ok) {
      setShowEnroll(false);
      setTarget({ year: "", class: "", section: "" });
      setRoll("");
    }
  };

  const startEdit = (en: Enrollment) =>
    setEditing({
      id: getId(en),
      year: en.academic_year_id,
      class: en.class_id,
      section: en.section_id,
      roll: en.roll_number ?? "",
      status: en.status ?? "ENROLLED",
    });

  const handleSaveEdit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;
    const ok = await run(
      () =>
        updateEnrollment(editing.id, {
          class_id: editing.class,
          section_id: editing.section,
          roll_number: emptyToNull(editing.roll),
          status: editing.status,
        }),
      "Failed to update enrollment"
    );
    if (ok) setEditing(null);
  };

  const rows = [...(history.data ?? [])].sort((a, b) => lookup.yearName(b.academic_year_id).localeCompare(lookup.yearName(a.academic_year_id)));

  return (
    <Card
      title="Enrollment"
      action={!showEnroll && <Button size="sm" onClick={() => setShowEnroll(true)}>+ Enroll</Button>}
    >
      <div className="space-y-4">
        {error && <Alert type="error">{error}</Alert>}
        {history.error && <Alert type="error">{history.error}</Alert>}

        {showEnroll && (
          <form onSubmit={handleEnroll} className="space-y-3 rounded-md border bg-muted/30 p-3">
            <ClassSectionPicker years={years} value={targetValue} onChange={setTarget} />
            <div className="flex flex-wrap items-end gap-2">
              <Field label="Roll number" htmlFor="enroll-roll" className="w-32">
                <Input id="enroll-roll" value={roll} onChange={(e) => setRoll(e.target.value)} />
              </Field>
              <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Enroll"}</Button>
              <Button type="button" variant="outline" onClick={() => setShowEnroll(false)}>Cancel</Button>
            </div>
          </form>
        )}

        {history.loading || lookup.loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState>Not enrolled in any class yet.</EmptyState>
        ) : (
          <ul className="divide-y rounded-md border">
            {rows.map((en) => {
              const id = getId(en);
              if (editing?.id === id) {
                const yearClasses = lookup.classes.filter((c) => c.academic_year_id === editing.year).sort(byDisplayOrder);
                const classSections = lookup.sections.filter((s) => s.class_id === editing.class);
                return (
                  <li key={id} className="p-3">
                    <form onSubmit={handleSaveEdit} className="flex flex-wrap items-end gap-2">
                      <Field label="Class" htmlFor="edit-class">
                        <Select id="edit-class" value={editing.class} onChange={(e) => setEditing({ ...editing, class: e.target.value, section: "" })}>
                          {yearClasses.map((c) => <option key={getId(c)} value={getId(c)}>{c.name}</option>)}
                        </Select>
                      </Field>
                      <Field label="Section" htmlFor="edit-section">
                        <Select id="edit-section" required value={editing.section} onChange={(e) => setEditing({ ...editing, section: e.target.value })}>
                          <option value="" disabled>Select</option>
                          {classSections.map((s) => <option key={getId(s)} value={getId(s)}>Section {s.name}</option>)}
                        </Select>
                      </Field>
                      <Field label="Roll" htmlFor="edit-roll" className="w-24">
                        <Input id="edit-roll" value={editing.roll} onChange={(e) => setEditing({ ...editing, roll: e.target.value })} />
                      </Field>
                      <Field label="Status" htmlFor="edit-status">
                        <Select id="edit-status" value={editing.status} onChange={(e) => setEditing({ ...editing, status: e.target.value as EnrollmentStatus })}>
                          {ENROLLMENT_STATUSES.map((s) => <option key={s} value={s}>{formatEnum(s)}</option>)}
                        </Select>
                      </Field>
                      <Button type="submit" disabled={busy}>Save</Button>
                      <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
                    </form>
                  </li>
                );
              }
              return (
                <li key={id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <div>
                    <p className="font-medium">
                      {lookup.className(en.class_id)} · Section {lookup.sectionName(en.section_id)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {lookup.yearName(en.academic_year_id)}
                      {en.roll_number ? ` · Roll ${en.roll_number}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge value={en.status ?? "ENROLLED"} tones={ENROLLMENT_STATUS_TONES} />
                    <Button variant="outline" size="sm" disabled={busy || !id} onClick={() => startEdit(en)}>Edit</Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </Card>
  );
}
