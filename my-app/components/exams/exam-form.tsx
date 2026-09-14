"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field, FormSection, Select } from "@/components/form";
import ClassSectionPicker, { type ClassSectionValue } from "@/components/class-section-picker";
import { useQuery } from "@/hooks/use-query";
import { listSubjects } from "@/lib/academic";
import { getId } from "@/lib/api";
import type { AcademicYear } from "@/lib/types/academic";
import {
  EXAM_STATUSES,
  EXAM_TYPES,
  type ExamSchedule,
  type ExamSchedulePayload,
  type ExamStatus,
  type ExamType,
} from "@/lib/types/exams";
import { emptyToNull, formatEnum, fromDateInput, getErrorMessage, toDateInput } from "@/lib/utils";

export type ExamFormResult = ExamSchedulePayload & { status: ExamStatus };

type Props = {
  years: AcademicYear[];
  defaultTarget: ClassSectionValue;
  initialData?: ExamSchedule;
  submitLabel: string;
  onSubmit: (result: ExamFormResult) => Promise<unknown>;
};

export default function ExamForm({ years, defaultTarget, initialData, submitLabel, onSubmit }: Props) {
  const isEdit = !!initialData;
  const [target, setTarget] = useState<ClassSectionValue>(
    initialData
      ? { year: initialData.academic_year_id, class: initialData.class_id, section: initialData.section_id ?? "" }
      : defaultTarget
  );
  const [form, setForm] = useState({
    subject_id: initialData?.subject_id ?? "",
    name: initialData?.name ?? "",
    exam_type: (initialData?.exam_type ?? "UNIT_TEST") as ExamType,
    exam_date: toDateInput(initialData?.exam_date),
    start_time: initialData?.start_time ?? "",
    end_time: initialData?.end_time ?? "",
    max_marks: String(initialData?.max_marks ?? 100),
    passing_marks: String(initialData?.passing_marks ?? 33),
    venue: initialData?.venue ?? "",
    status: (initialData?.status ?? "SCHEDULED") as ExamStatus,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Subjects taught in the selected class
  const subjects = useQuery(target.class ? `subjects:class:${target.class}` : null, async () => (await listSubjects({ class_id: target.class })) ?? []);

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    const max = Number(form.max_marks);
    const pass = Number(form.passing_marks);
    if (!target.class) return setError("Select a class.");
    if (!(max > 0)) return setError("Maximum marks must be greater than zero.");
    if (pass < 0 || pass > max) return setError("Passing marks must be between 0 and the maximum marks.");
    if (form.start_time && form.end_time && form.end_time <= form.start_time) return setError("End time must be after start time.");

    setLoading(true);
    try {
      await onSubmit({
        academic_year_id: target.year,
        class_id: target.class,
        section_id: target.section || null,
        subject_id: form.subject_id,
        name: form.name.trim(),
        exam_type: form.exam_type,
        exam_date: fromDateInput(form.exam_date),
        start_time: emptyToNull(form.start_time),
        end_time: emptyToNull(form.end_time),
        max_marks: max,
        passing_marks: pass,
        venue: emptyToNull(form.venue),
        status: form.status,
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save exam"));
    } finally {
      setLoading(false);
    }
  };

  const locked = isEdit ? "Can't be changed after scheduling" : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border bg-white p-4 shadow-sm sm:p-6">
      <FormSection title="Exam">
        <Field label="Class & section" htmlFor="picker-year" required hint={locked ?? "Leave section empty for all sections"} className="md:col-span-2">
          <fieldset disabled={isEdit}>
            <ClassSectionPicker
              years={years}
              value={target}
              onChange={(v) => {
                setTarget(v);
                if (v.class !== target.class) set("subject_id", "");
              }}
              sectionPlaceholder="All sections"
            />
          </fieldset>
        </Field>
        <Field label="Subject" htmlFor="exam-subject" required hint={locked}>
          <Select id="exam-subject" required disabled={isEdit || !target.class} value={form.subject_id} onChange={(e) => set("subject_id", e.target.value)}>
            <option value="" disabled>{subjects.loading ? "Loading..." : target.class ? "Select subject" : "Select a class first"}</option>
            {subjects.data?.map((s) => <option key={getId(s)} value={getId(s)}>{s.name}</option>)}
          </Select>
        </Field>
        <Field label="Exam type" htmlFor="exam-type" required hint={locked}>
          <Select id="exam-type" disabled={isEdit} value={form.exam_type} onChange={(e) => set("exam_type", e.target.value as ExamType)}>
            {EXAM_TYPES.map((t) => <option key={t} value={t}>{formatEnum(t)}</option>)}
          </Select>
        </Field>
        <Field label="Name" htmlFor="exam-name" required hint='For example "Mid-term Mathematics"' className="md:col-span-2">
          <Input id="exam-name" required value={form.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
      </FormSection>

      <FormSection title="Schedule & marks">
        <Field label="Date" htmlFor="exam-date" required>
          <Input id="exam-date" type="date" required value={form.exam_date} onChange={(e) => set("exam_date", e.target.value)} />
        </Field>
        <Field label="Venue" htmlFor="exam-venue">
          <Input id="exam-venue" placeholder="Room 12" value={form.venue} onChange={(e) => set("venue", e.target.value)} />
        </Field>
        <Field label="Start time" htmlFor="exam-start">
          <Input id="exam-start" type="time" value={form.start_time} onChange={(e) => set("start_time", e.target.value)} />
        </Field>
        <Field label="End time" htmlFor="exam-end">
          <Input id="exam-end" type="time" value={form.end_time} onChange={(e) => set("end_time", e.target.value)} />
        </Field>
        <Field label="Maximum marks" htmlFor="exam-max" required>
          <Input id="exam-max" type="number" min={1} step="0.5" required value={form.max_marks} onChange={(e) => set("max_marks", e.target.value)} />
        </Field>
        <Field label="Passing marks" htmlFor="exam-pass" required>
          <Input id="exam-pass" type="number" min={0} step="0.5" required value={form.passing_marks} onChange={(e) => set("passing_marks", e.target.value)} />
        </Field>
        {isEdit && (
          <Field label="Status" htmlFor="exam-status" required>
            <Select id="exam-status" value={form.status} onChange={(e) => set("status", e.target.value as ExamStatus)}>
              {EXAM_STATUSES.map((s) => <option key={s} value={s}>{formatEnum(s)}</option>)}
            </Select>
          </Field>
        )}
      </FormSection>

      {error && <Alert type="error">{error}</Alert>}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>{loading ? "Saving..." : submitLabel}</Button>
      </div>
    </form>
  );
}
