"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field } from "@/components/form";
import AcademicYearSelect from "@/components/academic-years/academic-year-select";
import type { AcademicYear, ClassPayload, SchoolClass } from "@/lib/types/academic";
import { getErrorMessage } from "@/lib/utils";

type Props = {
  years: AcademicYear[];
  /** Pre-selected year when creating. */
  defaultYearId?: string;
  /** When set, the form edits this class and the year is locked. */
  initialData?: SchoolClass;
  submitLabel: string;
  onSubmit: (payload: ClassPayload) => Promise<unknown>;
  onSuccess?: (payload: ClassPayload) => void;
};

export default function ClassForm({ years, defaultYearId = "", initialData, submitLabel, onSubmit, onSuccess }: Props) {
  const [yearId, setYearId] = useState(initialData?.academic_year_id ?? defaultYearId);
  const [name, setName] = useState(initialData?.name ?? "");
  const [displayOrder, setDisplayOrder] = useState(String(initialData?.display_order ?? 0));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    if (!yearId) {
      setError("Select an academic year.");
      return;
    }

    const payload: ClassPayload = {
      academic_year_id: yearId,
      name: name.trim(),
      display_order: Number(displayOrder) || 0,
    };

    setLoading(true);
    try {
      await onSubmit(payload);
      onSuccess?.(payload);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save class"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-card p-4 sm:p-6">
      <Field
        label="Academic year"
        htmlFor="academic_year_id"
        required
        hint={initialData ? "A class can't be moved to another academic year." : undefined}
      >
        <AcademicYearSelect years={years} value={yearId} onChange={setYearId} disabled={!!initialData} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Class name" htmlFor="name" required hint='For example "Class 5" or "UKG"'>
          <Input id="name" name="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Display order" htmlFor="display_order" hint="Lower numbers are listed first">
          <Input
            id="display_order"
            name="display_order"
            type="number"
            min={0}
            value={displayOrder}
            onChange={(e) => setDisplayOrder(e.target.value)}
          />
        </Field>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
