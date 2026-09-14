"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field, FormSection, Select } from "@/components/form";
import ClassSectionPicker from "@/components/class-section-picker";
import { getId } from "@/lib/api";
import type { AcademicYear } from "@/lib/types/academic";
import { FEE_FREQUENCIES, type FeeCategory, type FeeFrequency, type FeeStructure, type FeeStructurePayload } from "@/lib/types/fees";
import { formatCurrency, formatEnum, fromDateInput, getErrorMessage, toDateInput } from "@/lib/utils";

type Row = { category_id: string; amount: string };

type Props = {
  years: AcademicYear[];
  categories: FeeCategory[];
  defaultYearId: string;
  initialData?: FeeStructure;
  submitLabel: string;
  onSubmit: (payload: FeeStructurePayload) => Promise<unknown>;
};

export default function StructureForm({ years, categories, defaultYearId, initialData, submitLabel, onSubmit }: Props) {
  const isEdit = !!initialData;
  const [target, setTarget] = useState({ year: initialData?.academic_year_id ?? defaultYearId, class: initialData?.class_id ?? "", section: "" });
  const [name, setName] = useState(initialData?.name ?? "");
  const [frequency, setFrequency] = useState<FeeFrequency>(initialData?.frequency ?? "ANNUALLY");
  const [dueDate, setDueDate] = useState(toDateInput(initialData?.due_date));
  const [rows, setRows] = useState<Row[]>(
    initialData?.line_items?.map((li) => ({ category_id: li.category_id, amount: String(li.amount) })) ?? [{ category_id: "", amount: "" }]
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const total = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const usedCategories = new Set(rows.map((r) => r.category_id));

  const updateRow = (i: number, patch: Partial<Row>) => setRows((all) => all.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!target.class) {
      setError("Select a class.");
      return;
    }
    const items = rows.filter((r) => r.category_id);
    if (items.length === 0) {
      setError("Add at least one fee item.");
      return;
    }
    if (items.some((r) => !(Number(r.amount) > 0))) {
      setError("Each fee item needs an amount greater than zero.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        academic_year_id: target.year,
        class_id: target.class,
        name: name.trim(),
        frequency,
        due_date: dueDate ? fromDateInput(dueDate) : null,
        line_items: items.map((r) => ({
          category_id: r.category_id,
          category_name: categories.find((c) => getId(c) === r.category_id)?.name ?? "",
          amount: Number(r.amount),
        })),
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save fee structure"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border bg-white p-4 shadow-sm sm:p-6">
      <FormSection title="Structure">
        <Field label="Academic year & class" htmlFor="picker-year" required hint={isEdit ? "Can't be changed after creation" : undefined} className="md:col-span-2">
          <fieldset disabled={isEdit}>
            <ClassSectionPicker years={years} value={target} onChange={setTarget} hideSection />
          </fieldset>
        </Field>
        <Field label="Name" htmlFor="structure-name" required hint='For example "Class 5 Annual Fees 2026-27"'>
          <Input id="structure-name" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Frequency" htmlFor="structure-frequency" required>
          <Select id="structure-frequency" value={frequency} onChange={(e) => setFrequency(e.target.value as FeeFrequency)}>
            {FEE_FREQUENCIES.map((f) => <option key={f} value={f}>{formatEnum(f)}</option>)}
          </Select>
        </Field>
        <Field label="Due date" htmlFor="structure-due">
          <Input id="structure-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
      </FormSection>

      <fieldset className="space-y-3">
        <legend className="mb-2 w-full border-b pb-2 text-base font-semibold">Fee items</legend>
        {categories.length === 0 && (
          <Alert type="error">
            No fee categories yet. <Link href="/dashboard/fees/categories" className="underline">Create categories</Link> first.
          </Alert>
        )}
        {rows.map((row, i) => (
          <div key={i} className="flex gap-2">
            <Select aria-label="Fee category" value={row.category_id} onChange={(e) => updateRow(i, { category_id: e.target.value })} className="flex-1">
              <option value="">Select category</option>
              {categories.map((c) => {
                const id = getId(c);
                return (
                  <option key={id} value={id} disabled={usedCategories.has(id) && row.category_id !== id}>
                    {c.name}
                  </option>
                );
              })}
            </Select>
            <Input aria-label="Amount" type="number" min={0} step="0.01" placeholder="Amount (₹)" value={row.amount} onChange={(e) => updateRow(i, { amount: e.target.value })} className="w-36" />
            <Button type="button" variant="outline" size="icon" aria-label="Remove item" disabled={rows.length === 1} onClick={() => setRows((all) => all.filter((_, idx) => idx !== i))}>
              <Trash2 />
            </Button>
          </div>
        ))}
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" size="sm" onClick={() => setRows((all) => [...all, { category_id: "", amount: "" }])}>
            <Plus /> Add item
          </Button>
          <p className="text-sm">
            Total <span className="ml-1 text-lg font-semibold">{formatCurrency(total)}</span>
          </p>
        </div>
      </fieldset>

      {error && <Alert type="error">{error}</Alert>}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : submitLabel}</Button>
      </div>
    </form>
  );
}
