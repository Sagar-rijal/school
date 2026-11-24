"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import ClassSectionPicker, { type ClassSectionValue } from "@/components/class-section-picker";
import RosterChecklist from "@/components/fees/roster-checklist";
import { Alert, Field, PageHeader } from "@/components/form";
import { Card } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { createMiscellaneousCharges } from "@/lib/fees";
import { getRoster } from "@/lib/students";
import { formatCurrency, fromDateInput, getErrorMessage } from "@/lib/utils";

const MAX_STUDENTS = 500;

/** One-off charges (trip, lost ID card, lab breakage...) billed to chosen students. */
export default function MiscChargesPage() {
  const { years, defaultYearId } = useAcademicYears();
  const [selection, setSelection] = useState<ClassSectionValue>({ year: "", class: "", section: "" });
  const value = { ...selection, year: selection.year || defaultYearId };
  const roster = useQuery(value.year && value.class && value.section ? `roster:${value.year}:${value.class}:${value.section}` : null,
    () => getRoster(value.year, value.class, value.section));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setMessage("");
    const total = Number(amount);
    if (selected.size === 0) { setError("Select at least one student."); return; }
    if (selected.size > MAX_STUDENTS) { setError(`Select at most ${MAX_STUDENTS} students at a time.`); return; }
    if (!(total > 0)) { setError("Enter an amount greater than zero."); return; }
    if (!window.confirm(`Charge ${formatCurrency(total)} to ${selected.size} student(s)?`)) return;
    setBusy(true);
    try {
      await createMiscellaneousCharges({
        academic_year_id: value.year,
        class_id: value.class,
        student_ids: [...selected],
        description: description.trim(),
        amount: total,
        due_date: dueDate ? fromDateInput(dueDate) : null,
      });
      setMessage(`Charge added for ${selected.size} student(s).`);
      setSelected(new Set()); setDescription(""); setAmount(""); setDueDate("");
    } catch (err) { setError(getErrorMessage(err, "Could not add the charge")); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Extra charges" description="Bill a one-off amount to selected students, outside the fee structure" />
      {(error || roster.error) && <Alert type="error">{error || roster.error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      <form onSubmit={submit} className="space-y-5">
        <Card title="Students">
          <div className="space-y-3">
            <ClassSectionPicker years={years} value={value} onChange={(next) => { setSelection(next); setSelected(new Set()); }} />
            <RosterChecklist roster={roster.data} loading={roster.loading} selected={selected} onChange={setSelected} max={MAX_STUDENTS} />
          </div>
        </Card>
        <Card title="Charge">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Description" htmlFor="charge-desc" required className="sm:col-span-3">
              <Input id="charge-desc" required maxLength={250} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g. Science museum trip" />
            </Field>
            <Field label="Amount per student (₹)" htmlFor="charge-amount" required>
              <Input id="charge-amount" type="number" min={0.01} step={0.01} required value={amount} onChange={(e) => setAmount(e.target.value)} />
            </Field>
            <Field label="Due date" htmlFor="charge-due">
              <Input id="charge-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </Field>
          </div>
          <Button type="submit" className="mt-4" disabled={busy || selected.size === 0}>{busy ? "Saving..." : `Add charge${selected.size ? ` for ${selected.size}` : ""}`}</Button>
        </Card>
      </form>
    </div>
  );
}
