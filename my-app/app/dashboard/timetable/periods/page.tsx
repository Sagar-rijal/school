"use client";

import { use, useState } from "react";
import type { SubmitEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field, PageHeader, Select } from "@/components/form";
import { EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import AcademicYearSelect from "@/components/academic-years/academic-year-select";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { getId } from "@/lib/api";
import { createPeriod, deletePeriod, listPeriods, updatePeriod } from "@/lib/timetable";
import { SLOT_TYPES, type PeriodDefinition, type SlotType } from "@/lib/types/timetable";
import { cn, formatEnum, getErrorMessage } from "@/lib/utils";

type FormState = { period_number: string; name: string; start_time: string; end_time: string; slot_type: SlotType; is_break: boolean };

const emptyForm = (nextNumber: number, startTime = ""): FormState => ({
  period_number: String(nextNumber),
  name: `Period ${nextNumber}`,
  start_time: startTime,
  end_time: "",
  slot_type: "LECTURE",
  is_break: false,
});

export default function PeriodsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const filters = use(searchParams);
  const setFilters = useUrlFilters("/dashboard/timetable/periods", filters);
  const { years, defaultYearId } = useAcademicYears();
  const year = filters.year || defaultYearId;

  const periods = useQuery(year ? `periods:${year}` : null, () => listPeriods(year));
  const rows = periods.data ?? [];
  const last = rows.at(-1);

  const [editingId, setEditingId] = useState<string | null>(null);
  // null = use the suggested next period (derived from the list)
  const [formState, setFormState] = useState<FormState | null>(null);
  const form = formState ?? emptyForm((last?.period_number ?? 0) + 1, last?.end_time ?? "");
  const setForm = (patch: Partial<FormState>) => setFormState({ ...form, ...patch });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setEditingId(null);
    setFormState(null);
  };

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setBusy(true);
    setError("");
    try {
      await action();
      periods.reload();
      return true;
    } catch (err) {
      setError(getErrorMessage(err, fallback));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (form.end_time <= form.start_time) {
      setError("End time must be after start time.");
      return;
    }
    const common = {
      name: form.name.trim(),
      start_time: form.start_time,
      end_time: form.end_time,
      slot_type: form.is_break ? ("BREAK" as const) : form.slot_type,
      is_break: form.is_break,
    };
    const ok = await run(
      () =>
        editingId
          ? updatePeriod(editingId, common)
          : createPeriod({ ...common, academic_year_id: year, period_number: Number(form.period_number) }),
      "Failed to save period"
    );
    if (ok) reset();
  };

  const startEdit = (p: PeriodDefinition) => {
    setEditingId(getId(p));
    setFormState({
      period_number: String(p.period_number),
      name: p.name,
      start_time: p.start_time,
      end_time: p.end_time,
      slot_type: p.slot_type,
      is_break: p.is_break,
    });
  };

  const handleDelete = (p: PeriodDefinition) => {
    if (!window.confirm(`Delete ${p.name}? Timetable slots in this period may stop showing.`)) return;
    run(() => deletePeriod(getId(p)), "Failed to delete period");
  };

  return (
    <div className="max-w-4xl space-y-4">
      <PageHeader title="Periods" description="The school day's period structure for an academic year" />

      <AcademicYearSelect years={years} value={year} onChange={(y) => { reset(); setFilters({ year: y }); }} className="w-auto min-w-40" />

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-4 sm:p-6">
        <h2 className="font-semibold">{editingId ? `Edit period ${form.period_number}` : "Add period"}</h2>
        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Field label="Number" htmlFor="p-number" required hint={editingId ? "Fixed" : undefined}>
            <Input id="p-number" type="number" min={0} required disabled={!!editingId} value={form.period_number} onChange={(e) => setForm({ period_number: e.target.value })} />
          </Field>
          <Field label="Name" htmlFor="p-name" required className="sm:col-span-2">
            <Input id="p-name" required value={form.name} onChange={(e) => setForm({ name: e.target.value })} />
          </Field>
          <Field label="Start" htmlFor="p-start" required>
            <Input id="p-start" type="time" required value={form.start_time} onChange={(e) => setForm({ start_time: e.target.value })} />
          </Field>
          <Field label="End" htmlFor="p-end" required>
            <Input id="p-end" type="time" required value={form.end_time} onChange={(e) => setForm({ end_time: e.target.value })} />
          </Field>
          <Field label="Type" htmlFor="p-type">
            <Select id="p-type" disabled={form.is_break} value={form.is_break ? "BREAK" : form.slot_type} onChange={(e) => setForm({ slot_type: e.target.value as SlotType })}>
              {SLOT_TYPES.map((t) => <option key={t} value={t}>{formatEnum(t)}</option>)}
            </Select>
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4" checked={form.is_break} onChange={(e) => setForm({ is_break: e.target.checked })} />
          This is a break (lunch, recess) — no classes are scheduled in it
        </label>
        {error && <Alert type="error">{error}</Alert>}
        <div className="flex justify-end gap-2">
          {(editingId || formState) && <Button type="button" variant="outline" onClick={reset}>Cancel</Button>}
          <Button type="submit" disabled={busy || !year}>{busy ? "Saving..." : editingId ? "Save changes" : "Add period"}</Button>
        </div>
      </form>

      {periods.error && <Alert type="error">{periods.error}</Alert>}
      {periods.loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState>No periods defined for this year yet. Add them in order, starting with Period 1.</EmptyState>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH className="w-16">#</TH>
              <TH>Name</TH>
              <TH>Time</TH>
              <TH>Type</TH>
              <TH />
            </tr>
          </THead>
          <TBody>
            {rows.map((p) => (
              <tr key={getId(p)} className={cn(p.is_break && "bg-muted/40")}>
                <TD className="font-mono">{p.period_number}</TD>
                <TD className="font-medium">{p.name}</TD>
                <TD>{p.start_time}–{p.end_time}</TD>
                <TD>{p.is_break ? "Break" : formatEnum(p.slot_type)}</TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="icon-sm" aria-label={`Edit ${p.name}`} disabled={busy} onClick={() => startEdit(p)}><Pencil /></Button>
                    <Button variant="outline" size="icon-sm" aria-label={`Delete ${p.name}`} disabled={busy} onClick={() => handleDelete(p)} className="text-red-600 hover:text-red-700"><Trash2 /></Button>
                  </div>
                </TD>
              </tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
