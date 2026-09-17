"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field } from "@/components/form";
import AcademicYearSelect from "@/components/academic-years/academic-year-select";
import { getId } from "@/lib/api";
import type { AcademicYear, SchoolClass, Subject, SubjectPayload } from "@/lib/types/academic";
import { getErrorMessage } from "@/lib/utils";

type Props = {
  years: AcademicYear[];
  classes: SchoolClass[];
  defaultYearId: string;
  initialData?: Subject;
  submitLabel: string;
  onSubmit: (payload: SubjectPayload) => Promise<unknown>;
  onSuccess?: () => void;
};

export default function SubjectForm({ years, classes, defaultYearId, initialData, submitLabel, onSubmit, onSuccess }: Props) {
  const [name, setName] = useState(initialData?.name ?? "");
  const [code, setCode] = useState(initialData?.code ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [classIds, setClassIds] = useState<string[]>(initialData?.class_ids ?? []);
  // Only controls which year's classes are shown; selections from every year are kept
  const [yearId, setYearId] = useState(defaultYearId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const yearClasses = classes.filter((c) => c.academic_year_id === yearId);
  const otherSelected = classes.filter((c) => classIds.includes(getId(c)) && c.academic_year_id !== yearId);
  const yearName = (id: string) => years.find((y) => getId(y) === id)?.name ?? "";

  const toggleClass = (id: string) =>
    setClassIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        description: description.trim() || null,
        class_ids: classIds,
      });
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save subject"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border bg-card p-4 sm:p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Subject name" htmlFor="name" required hint='For example "Mathematics"'>
          <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Code" htmlFor="code" required hint='Short unique code, e.g. "MATH"'>
          <Input
            id="code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="font-mono uppercase"
          />
        </Field>
        <Field label="Description" htmlFor="description" className="sm:col-span-2">
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Taught in classes</legend>

        <div className="flex flex-wrap items-center gap-2">
          <label htmlFor="class-year" className="text-sm text-muted-foreground">
            Show classes for
          </label>
          <AcademicYearSelect id="class-year" years={years} value={yearId} onChange={setYearId} className="w-auto min-w-40" />
        </div>

        {yearClasses.length === 0 ? (
          <p className="text-sm text-muted-foreground">No classes in this academic year.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {yearClasses.map((c) => {
              const id = getId(c);
              return (
                <label key={id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-accent">
                  <input type="checkbox" checked={classIds.includes(id)} onChange={() => toggleClass(id)} className="size-4" />
                  {c.name}
                </label>
              );
            })}
          </div>
        )}

        {otherSelected.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Also selected in other years:</p>
            <div className="flex flex-wrap gap-1.5">
              {otherSelected.map((c) => (
                <span key={getId(c)} className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-xs">
                  {c.name} ({yearName(c.academic_year_id)})
                  <button type="button" onClick={() => toggleClass(getId(c))} aria-label={`Remove ${c.name}`}>
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          {classIds.length} class{classIds.length === 1 ? "" : "es"} selected. You can also leave this empty and link classes later.
        </p>
      </fieldset>

      {error && <Alert type="error">{error}</Alert>}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
