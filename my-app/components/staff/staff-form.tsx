"use client";

import { useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field, FormSection, Select } from "@/components/form";
import { getId } from "@/lib/api";
import type { Subject } from "@/lib/types/academic";
import {
  EMPLOYMENT_TYPES,
  STAFF_STATUSES,
  STAFF_TYPES,
  type Department,
  type EmploymentType,
  type Qualification,
  type StaffMember,
  type StaffPayload,
  type StaffStatus,
  type StaffType,
} from "@/lib/types/staff";
import { emptyToNull, formatEnum, fromDateInput, getErrorMessage, toDateInput, todayInput } from "@/lib/utils";

type FormState = {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  address: string;
  profile_photo_url: string;
  staff_type: StaffType;
  designation: string;
  department_id: string;
  employment_type: EmploymentType;
  joining_date: string;
  status: StaffStatus;
  user_id: string;
};

type QualificationRow = { degree: string; institution: string; year: string };

export type StaffFormResult = StaffPayload & { status: StaffStatus };

type Props = {
  departments: Department[];
  subjects: Subject[];
  initialData?: StaffMember;
  submitLabel: string;
  onSubmit: (result: StaffFormResult) => Promise<unknown>;
  onSuccess?: () => void;
};

export default function StaffForm({ departments, subjects, initialData, submitLabel, onSubmit, onSuccess }: Props) {
  const isEdit = !!initialData;
  const [form, setForm] = useState<FormState>({
    employee_id: initialData?.employee_id ?? "",
    first_name: initialData?.first_name ?? "",
    last_name: initialData?.last_name ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    gender: initialData?.gender ?? "",
    date_of_birth: toDateInput(initialData?.date_of_birth),
    address: initialData?.address ?? "",
    profile_photo_url: initialData?.profile_photo_url ?? "",
    staff_type: initialData?.staff_type ?? "TEACHING",
    designation: initialData?.designation ?? "",
    department_id: initialData?.department_id ?? "",
    employment_type: initialData?.employment_type ?? "FULL_TIME",
    joining_date: toDateInput(initialData?.joining_date) || todayInput(),
    status: initialData?.status ?? "ACTIVE",
    user_id: initialData?.user_id ?? "",
  });
  const [subjectIds, setSubjectIds] = useState<string[]>(initialData?.subject_ids ?? []);
  const [qualifications, setQualifications] = useState<QualificationRow[]>(
    (initialData?.qualifications ?? []).map((q) => ({ degree: q.degree, institution: q.institution, year: String(q.year) }))
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const updateQualification = (index: number, key: keyof QualificationRow, value: string) =>
    setQualifications((rows) => rows.map((row, i) => (i === index ? { ...row, [key]: value } : row)));

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const filledQualifications: Qualification[] = [];
    for (const q of qualifications) {
      if (!q.degree.trim() && !q.institution.trim() && !q.year.trim()) continue; // skip blank rows
      const year = Number(q.year);
      if (!q.degree.trim() || !q.institution.trim() || !Number.isInteger(year)) {
        setError("Each qualification needs a degree, institution and year.");
        return;
      }
      filledQualifications.push({ degree: q.degree.trim(), institution: q.institution.trim(), year });
    }

    setLoading(true);
    try {
      await onSubmit({
        employee_id: form.employee_id.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        gender: emptyToNull(form.gender),
        date_of_birth: form.date_of_birth ? fromDateInput(form.date_of_birth) : null,
        address: emptyToNull(form.address),
        profile_photo_url: emptyToNull(form.profile_photo_url),
        staff_type: form.staff_type,
        designation: emptyToNull(form.designation),
        department_id: emptyToNull(form.department_id),
        employment_type: form.employment_type,
        // Subjects only apply to teaching staff
        subject_ids: form.staff_type === "TEACHING" ? subjectIds : [],
        qualifications: filledQualifications,
        joining_date: fromDateInput(form.joining_date),
        user_id: emptyToNull(form.user_id),
        status: form.status,
      });
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save staff member"));
    } finally {
      setLoading(false);
    }
  };

  const lockedHint = isEdit ? "Can't be changed after onboarding" : undefined;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border bg-white p-4 shadow-sm sm:p-6">
      <FormSection title="Personal details">
        <Field label="First name" htmlFor="first_name" required>
          <Input id="first_name" name="first_name" required value={form.first_name} onChange={handleChange} />
        </Field>
        <Field label="Last name" htmlFor="last_name" required>
          <Input id="last_name" name="last_name" required value={form.last_name} onChange={handleChange} />
        </Field>
        <Field label="Email" htmlFor="email" required>
          <Input id="email" name="email" type="email" required value={form.email} onChange={handleChange} />
        </Field>
        <Field label="Phone" htmlFor="phone" required>
          <Input id="phone" name="phone" type="tel" required value={form.phone} onChange={handleChange} />
        </Field>
        <Field label="Gender" htmlFor="gender">
          <Select id="gender" name="gender" value={form.gender} onChange={handleChange}>
            <option value="">Not specified</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </Select>
        </Field>
        <Field label="Date of birth" htmlFor="date_of_birth">
          <Input id="date_of_birth" name="date_of_birth" type="date" value={form.date_of_birth} onChange={handleChange} />
        </Field>
        <Field label="Address" htmlFor="address" className="md:col-span-2">
          <Input id="address" name="address" value={form.address} onChange={handleChange} />
        </Field>
        <Field label="Profile photo URL" htmlFor="profile_photo_url" className="md:col-span-2">
          <Input id="profile_photo_url" name="profile_photo_url" type="url" placeholder="https://..." value={form.profile_photo_url} onChange={handleChange} />
        </Field>
      </FormSection>

      <FormSection title="Employment">
        <Field label="Employee ID" htmlFor="employee_id" required hint={lockedHint}>
          <Input id="employee_id" name="employee_id" required disabled={isEdit} value={form.employee_id} onChange={handleChange} />
        </Field>
        <Field label="Staff type" htmlFor="staff_type" required hint={lockedHint}>
          <Select id="staff_type" name="staff_type" disabled={isEdit} value={form.staff_type} onChange={handleChange}>
            {STAFF_TYPES.map((t) => <option key={t} value={t}>{formatEnum(t)}</option>)}
          </Select>
        </Field>
        <Field label="Designation" htmlFor="designation" hint='For example "PGT Mathematics"'>
          <Input id="designation" name="designation" value={form.designation} onChange={handleChange} />
        </Field>
        <Field label="Department" htmlFor="department_id">
          <Select id="department_id" name="department_id" value={form.department_id} onChange={handleChange}>
            <option value="">No department</option>
            {departments.map((d) => <option key={getId(d)} value={getId(d)}>{d.name}</option>)}
          </Select>
        </Field>
        <Field label="Employment type" htmlFor="employment_type" required>
          <Select id="employment_type" name="employment_type" value={form.employment_type} onChange={handleChange}>
            {EMPLOYMENT_TYPES.map((t) => <option key={t} value={t}>{formatEnum(t)}</option>)}
          </Select>
        </Field>
        <Field label="Joining date" htmlFor="joining_date" required hint={lockedHint}>
          <Input id="joining_date" name="joining_date" type="date" required disabled={isEdit} value={form.joining_date} onChange={handleChange} />
        </Field>
        {isEdit && (
          <Field label="Status" htmlFor="status" required>
            <Select id="status" name="status" value={form.status} onChange={handleChange}>
              {STAFF_STATUSES.map((s) => <option key={s} value={s}>{formatEnum(s)}</option>)}
            </Select>
          </Field>
        )}
      </FormSection>

      {form.staff_type === "TEACHING" && (
        <fieldset className="space-y-3">
          <legend className="mb-2 w-full border-b pb-2 text-base font-semibold">Subjects taught</legend>
          {subjects.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No subjects yet. <Link href="/dashboard/subjects/new" className="underline">Add subjects</Link> first.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {subjects.map((s) => {
                const id = getId(s);
                return (
                  <label key={id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm has-checked:border-primary has-checked:bg-accent">
                    <input
                      type="checkbox"
                      className="size-4"
                      checked={subjectIds.includes(id)}
                      onChange={() => setSubjectIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
                    />
                    {s.name}
                  </label>
                );
              })}
            </div>
          )}
        </fieldset>
      )}

      <fieldset className="space-y-3">
        <legend className="mb-2 w-full border-b pb-2 text-base font-semibold">Qualifications</legend>
        {qualifications.map((q, i) => (
          <div key={i} className="grid grid-cols-[1fr_auto] gap-2 sm:grid-cols-[2fr_2fr_7rem_auto]">
            <Input aria-label="Degree" placeholder="Degree, e.g. B.Ed" value={q.degree} onChange={(e) => updateQualification(i, "degree", e.target.value)} className="col-span-2 sm:col-span-1" />
            <Input aria-label="Institution" placeholder="Institution" value={q.institution} onChange={(e) => updateQualification(i, "institution", e.target.value)} className="col-span-2 sm:col-span-1" />
            <Input aria-label="Year" type="number" placeholder="Year" min={1950} max={new Date().getFullYear()} value={q.year} onChange={(e) => updateQualification(i, "year", e.target.value)} />
            <Button type="button" variant="outline" size="icon" aria-label="Remove qualification" onClick={() => setQualifications((rows) => rows.filter((_, idx) => idx !== i))}>
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setQualifications((rows) => [...rows, { degree: "", institution: "", year: "" }])}>
          <Plus /> Add qualification
        </Button>
      </fieldset>

      <FormSection title="Login account">
        <Field
          label="User ID"
          htmlFor="user_id"
          hint="The staff member's login account. Teachers need one to be assigned to classes."
          className="md:col-span-2"
        >
          <div className="flex gap-2">
            <Input id="user_id" name="user_id" className="font-mono" value={form.user_id} onChange={handleChange} />
            <Button type="button" variant="outline" asChild>
              <Link href="/dashboard/users/new" target="_blank">Create user</Link>
            </Button>
          </div>
        </Field>
      </FormSection>

      {error && <Alert type="error">{error}</Alert>}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
