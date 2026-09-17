"use client";

import { useState } from "react";
import type { ChangeEvent, ReactNode, SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field, FormSection, Select } from "@/components/form";
import {
  BLOOD_GROUPS,
  GENDERS,
  STUDENT_STATUSES,
  type BloodGroup,
  type Gender,
  type Student,
  type StudentPayload,
  type StudentStatus,
} from "@/lib/types/student";
import { emptyToNull, formatEnum, fromDateInput, getErrorMessage, toDateInput } from "@/lib/utils";

export type StudentFormResult = StudentPayload & { status: StudentStatus };

type Props = {
  initialData?: Student;
  submitLabel: string;
  onSubmit: (result: StudentFormResult) => Promise<unknown>;
  /** Extra fields rendered before the submit button (e.g. enrollment). */
  children?: ReactNode;
};

export default function StudentForm({ initialData, submitLabel, onSubmit, children }: Props) {
  const isEdit = !!initialData;
  const [form, setForm] = useState({
    admission_number: initialData?.admission_number ?? "",
    first_name: initialData?.first_name ?? "",
    last_name: initialData?.last_name ?? "",
    date_of_birth: toDateInput(initialData?.date_of_birth),
    gender: initialData?.gender ?? "",
    blood_group: initialData?.blood_group ?? "",
    phone: initialData?.phone ?? "",
    email: initialData?.email ?? "",
    address: initialData?.address ?? "",
    profile_photo_url: initialData?.profile_photo_url ?? "",
    status: initialData?.status ?? "ACTIVE",
    ec_name: initialData?.emergency_contact?.name ?? "",
    ec_relation: initialData?.emergency_contact?.relation ?? "",
    ec_phone: initialData?.emergency_contact?.phone ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // Emergency contact is optional, but if any part is filled all three are required
  const hasEmergencyContact = [form.ec_name, form.ec_relation, form.ec_phone].some((v) => v.trim());

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit({
        admission_number: form.admission_number.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        date_of_birth: fromDateInput(form.date_of_birth),
        gender: form.gender as Gender,
        blood_group: (form.blood_group || null) as BloodGroup | null,
        phone: emptyToNull(form.phone),
        email: emptyToNull(form.email.toLowerCase()),
        address: emptyToNull(form.address),
        profile_photo_url: emptyToNull(form.profile_photo_url),
        emergency_contact: hasEmergencyContact
          ? { name: form.ec_name.trim(), relation: form.ec_relation.trim(), phone: form.ec_phone.trim() }
          : null,
        status: form.status as StudentStatus,
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save student"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border bg-card p-4 sm:p-6">
      <FormSection title="Student details">
        <Field label="Admission number" htmlFor="admission_number" required hint={isEdit ? "Can't be changed" : undefined}>
          <Input id="admission_number" name="admission_number" required disabled={isEdit} value={form.admission_number} onChange={handleChange} />
        </Field>
        {isEdit ? (
          <Field label="Status" htmlFor="status" required>
            <Select id="status" name="status" value={form.status} onChange={handleChange}>
              {STUDENT_STATUSES.map((s) => <option key={s} value={s}>{formatEnum(s)}</option>)}
            </Select>
          </Field>
        ) : (
          <div className="hidden md:block" />
        )}
        <Field label="First name" htmlFor="first_name" required>
          <Input id="first_name" name="first_name" required value={form.first_name} onChange={handleChange} />
        </Field>
        <Field label="Last name" htmlFor="last_name" required>
          <Input id="last_name" name="last_name" required value={form.last_name} onChange={handleChange} />
        </Field>
        <Field label="Date of birth" htmlFor="date_of_birth" required>
          <Input id="date_of_birth" name="date_of_birth" type="date" required value={form.date_of_birth} onChange={handleChange} />
        </Field>
        <Field label="Gender" htmlFor="gender" required>
          <Select id="gender" name="gender" required value={form.gender} onChange={handleChange}>
            <option value="" disabled>Select gender</option>
            {GENDERS.map((g) => <option key={g} value={g}>{formatEnum(g)}</option>)}
          </Select>
        </Field>
        <Field label="Blood group" htmlFor="blood_group">
          <Select id="blood_group" name="blood_group" value={form.blood_group} onChange={handleChange}>
            <option value="">Unknown</option>
            {BLOOD_GROUPS.map((b) => <option key={b} value={b}>{b}</option>)}
          </Select>
        </Field>
      </FormSection>

      <FormSection title="Contact">
        <Field label="Phone" htmlFor="phone">
          <Input id="phone" name="phone" type="tel" value={form.phone} onChange={handleChange} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
        </Field>
        <Field label="Address" htmlFor="address" className="md:col-span-2">
          <Input id="address" name="address" value={form.address} onChange={handleChange} />
        </Field>
        <Field label="Profile photo URL" htmlFor="profile_photo_url" className="md:col-span-2">
          <Input id="profile_photo_url" name="profile_photo_url" type="url" placeholder="https://..." value={form.profile_photo_url} onChange={handleChange} />
        </Field>
      </FormSection>

      <div className="space-y-2">
        <FormSection title="Emergency contact (optional)">
          <Field label="Name" htmlFor="ec_name" required={hasEmergencyContact}>
            <Input id="ec_name" name="ec_name" required={hasEmergencyContact} value={form.ec_name} onChange={handleChange} />
          </Field>
          <Field label="Relation" htmlFor="ec_relation" required={hasEmergencyContact}>
            <Input id="ec_relation" name="ec_relation" placeholder="Father, Aunt..." required={hasEmergencyContact} value={form.ec_relation} onChange={handleChange} />
          </Field>
          <Field label="Phone" htmlFor="ec_phone" required={hasEmergencyContact}>
            <Input id="ec_phone" name="ec_phone" type="tel" required={hasEmergencyContact} value={form.ec_phone} onChange={handleChange} />
          </Field>
        </FormSection>
        <p className="text-xs text-muted-foreground">Leave empty, or fill in all three fields.</p>
      </div>

      {children}

      {error && <Alert type="error">{error}</Alert>}

      <div className="flex justify-end">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}
