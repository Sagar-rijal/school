"use client";

import { useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field, FormSection, Select } from "@/components/form";
import { getErrorMessage } from "@/lib/utils";
import {
  SCHOOL_BOARDS,
  SCHOOL_MEDIUMS,
  SCHOOL_TYPES,
  type School,
  type SchoolPayload,
} from "@/lib/types/school";

type FormState = {
  name: string;
  board: string;
  medium: string;
  type: string;
  establishedYear: string;
  email: string;
  phone: string;
  website: string;
  brandingLogo: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  status: string;
};

const EMPTY: FormState = {
  name: "",
  board: "CBSE",
  medium: "ENGLISH",
  type: "PRIVATE",
  establishedYear: "",
  email: "",
  phone: "",
  website: "",
  brandingLogo: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  status: "1",
};

function toFormState(school: School): FormState {
  return {
    name: school.school_info?.name ?? "",
    board: school.school_info?.board ?? EMPTY.board,
    medium: school.school_info?.medium ?? EMPTY.medium,
    type: school.school_info?.type ?? EMPTY.type,
    establishedYear: String(school.school_info?.establishedYear ?? ""),
    email: school.contact_info?.email ?? "",
    phone: school.contact_info?.phone ?? "",
    website: school.contact_info?.website ?? "",
    brandingLogo: school.contact_info?.brandingLogo ?? "",
    addressLine1: school.address?.addressLine1 ?? "",
    addressLine2: school.address?.addressLine2 ?? "",
    city: school.address?.city ?? "",
    state: school.address?.state ?? "",
    pincode: school.address?.pincode ?? "",
    country: school.address?.country ?? "India",
    status: String(school.status ?? 1),
  };
}

function toPayload(f: FormState): SchoolPayload {
  return {
    school_info: {
      name: f.name.trim(),
      board: f.board as SchoolPayload["school_info"]["board"],
      medium: f.medium as SchoolPayload["school_info"]["medium"],
      type: f.type as SchoolPayload["school_info"]["type"],
      establishedYear: Number(f.establishedYear),
    },
    contact_info: {
      email: f.email.trim().toLowerCase(),
      phone: f.phone.trim(),
      website: f.website.trim(),
      brandingLogo: f.brandingLogo.trim(),
    },
    address: {
      addressLine1: f.addressLine1.trim(),
      addressLine2: f.addressLine2.trim(),
      city: f.city.trim(),
      state: f.state.trim(),
      pincode: f.pincode.trim(),
      country: f.country.trim(),
    },
    status: f.status === "1" ? 1 : 0,
  };
}

function validate(f: FormState): string | null {
  const year = Number(f.establishedYear);
  if (!Number.isInteger(year) || year < 1800 || year > new Date().getFullYear()) {
    return "Established year must be between 1800 and this year.";
  }
  if (!/^\d{10}$/.test(f.phone.trim())) return "Phone must be 10 digits.";
  if (!/^\d{6}$/.test(f.pincode.trim())) return "Pincode must be 6 digits.";
  return null;
}

type Props = {
  initialData?: School;
  submitLabel: string;
  onSubmit: (payload: SchoolPayload) => Promise<unknown>;
  /** Called after a successful submit, e.g. to redirect. */
  onSuccess?: () => void;
};

export default function SchoolForm({ initialData, submitLabel, onSubmit, onSuccess }: Props) {
  const [form, setForm] = useState<FormState>(initialData ? toFormState(initialData) : EMPTY);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    const validationError = validate(form);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(toPayload(form));
      onSuccess?.();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save school"));
    } finally {
      setLoading(false);
    }
  };

  const input = (name: keyof FormState, props: React.ComponentProps<"input"> = {}) => (
    <Input id={name} name={name} value={form[name]} onChange={handleChange} {...props} />
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border bg-card p-4 sm:p-6">
      <FormSection title="School info">
        <Field label="School name" htmlFor="name" required className="md:col-span-2">
          {input("name", { required: true })}
        </Field>
        <Field label="Board" htmlFor="board" required>
          <Select id="board" name="board" value={form.board} onChange={handleChange}>
            {SCHOOL_BOARDS.map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
        </Field>
        <Field label="Medium" htmlFor="medium" required>
          <Select id="medium" name="medium" value={form.medium} onChange={handleChange}>
            {SCHOOL_MEDIUMS.map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
        </Field>
        <Field label="Type" htmlFor="type" required>
          <Select id="type" name="type" value={form.type} onChange={handleChange}>
            {SCHOOL_TYPES.map((v) => <option key={v} value={v}>{v}</option>)}
          </Select>
        </Field>
        <Field label="Established year" htmlFor="establishedYear" required>
          {input("establishedYear", { type: "number", required: true, min: 1800, max: new Date().getFullYear() })}
        </Field>
        <Field label="Status" htmlFor="status" required>
          <Select id="status" name="status" value={form.status} onChange={handleChange}>
            <option value="1">Active</option>
            <option value="0">Inactive</option>
          </Select>
        </Field>
      </FormSection>

      <FormSection title="Contact info">
        <Field label="Email" htmlFor="email" required>
          {input("email", { type: "email", required: true })}
        </Field>
        <Field label="Phone" htmlFor="phone" required hint="10 digits">
          {input("phone", { type: "tel", required: true, maxLength: 10 })}
        </Field>
        {/* Backend requires these keys but accepts empty strings, so they're optional here */}
        <Field label="Website" htmlFor="website">
          {input("website", { type: "url", placeholder: "https://..." })}
        </Field>
        <Field label="Branding logo URL" htmlFor="brandingLogo" hint="Link to the school logo image">
          {input("brandingLogo", { type: "url", placeholder: "https://..." })}
        </Field>
      </FormSection>

      <FormSection title="Address">
        <Field label="Address line 1" htmlFor="addressLine1" required>
          {input("addressLine1", { required: true })}
        </Field>
        <Field label="Address line 2" htmlFor="addressLine2">
          {input("addressLine2")}
        </Field>
        <Field label="City" htmlFor="city" required>
          {input("city", { required: true })}
        </Field>
        <Field label="State" htmlFor="state" required>
          {input("state", { required: true })}
        </Field>
        <Field label="Pincode" htmlFor="pincode" required hint="6 digits">
          {input("pincode", { required: true, maxLength: 6 })}
        </Field>
        <Field label="Country" htmlFor="country" required>
          {input("country", { required: true })}
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
