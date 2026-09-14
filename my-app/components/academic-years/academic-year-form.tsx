"use client";

import { useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field } from "@/components/form";
import type { AcademicYear, AcademicYearPayload } from "@/lib/types/academic";
import { fromDateInput, getErrorMessage, toDateInput } from "@/lib/utils";

type FormState = {
  name: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  is_current: boolean;
};

type Props = {
  initialData?: AcademicYear;
  submitLabel: string;
  onSubmit: (payload: AcademicYearPayload) => Promise<unknown>;
  onSuccess?: () => void;
};

export default function AcademicYearForm({ initialData, submitLabel, onSubmit, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>({
    name: initialData?.name ?? "",
    start_date: toDateInput(initialData?.start_date),
    end_date: toDateInput(initialData?.end_date),
    is_current: initialData?.is_current ?? false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    // YYYY-MM-DD strings compare correctly as text
    if (form.end_date <= form.start_date) {
      setError("End date must be after the start date.");
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        start_date: fromDateInput(form.start_date),
        end_date: fromDateInput(form.end_date),
        is_current: form.is_current,
      });
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save academic year"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-white p-4 shadow-sm sm:p-6">
      <Field label="Name" htmlFor="name" required hint='For example "2026-27"'>
        <Input id="name" name="name" required value={form.name} onChange={handleChange} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date" htmlFor="start_date" required>
          <Input id="start_date" name="start_date" type="date" required value={form.start_date} onChange={handleChange} />
        </Field>
        <Field label="End date" htmlFor="end_date" required>
          <Input id="end_date" name="end_date" type="date" required value={form.end_date} onChange={handleChange} />
        </Field>
      </div>

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="is_current"
          checked={form.is_current}
          onChange={handleChange}
          className="mt-0.5 size-4"
        />
        <span>
          <span className="font-medium">Current academic year</span>
          <span className="block text-muted-foreground">
            Classes, attendance and fees default to the current year.
          </span>
        </span>
      </label>

      {error && <Alert type="error">{error}</Alert>}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
