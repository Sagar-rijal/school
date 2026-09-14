"use client";

import { useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field, FormSection, PageHeader } from "@/components/form";
import { createUser } from "@/lib/user";
import type { CreateUserPayload, UserPersonalInfo } from "@/lib/types/user";
import { getErrorMessage } from "@/lib/utils";

const EMPTY_BASIC = { name: "", email: "", password: "", phone_number: "" };

const EMPTY_PERSONAL: UserPersonalInfo = {
  father_name: "",
  mother_name: "",
  dob: "",
  id_number: "",
  current_address: "",
  permanent_address: "",
  gurdian_name: "",
  gurdian_contact: "",
};

const PERSONAL_FIELDS: { name: keyof UserPersonalInfo; label: string; type?: string; wide?: boolean }[] = [
  { name: "father_name", label: "Father's name" },
  { name: "mother_name", label: "Mother's name" },
  { name: "dob", label: "Date of birth", type: "date" },
  { name: "id_number", label: "ID number (Aadhaar/PAN)" },
  { name: "current_address", label: "Current address", wide: true },
  { name: "permanent_address", label: "Permanent address", wide: true },
  { name: "gurdian_name", label: "Guardian's name" },
  { name: "gurdian_contact", label: "Guardian's contact", type: "tel" },
];

export default function CreateUserPage() {
  const [basic, setBasic] = useState(EMPTY_BASIC);
  const [personal, setPersonal] = useState<UserPersonalInfo>(EMPTY_PERSONAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // The backend accepts userPersonalInfo as optional, but if sent, every field is required.
  const hasPersonalInfo = Object.values(personal).some((v) => v.trim() !== "");

  const handleBasicChange = (e: ChangeEvent<HTMLInputElement>) =>
    setBasic((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handlePersonalChange = (e: ChangeEvent<HTMLInputElement>) =>
    setPersonal((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    const payload: CreateUserPayload = {
      name: basic.name.trim(),
      email: basic.email.trim().toLowerCase(),
      password: basic.password,
      phone_number: basic.phone_number.trim() || null,
      userPersonalInfo: hasPersonalInfo ? personal : null,
    };

    setLoading(true);
    try {
      await createUser(payload);
      setSuccess(`User ${payload.email} created successfully.`);
      setBasic(EMPTY_BASIC);
      setPersonal(EMPTY_PERSONAL);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create user"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Create user" description="Add a login account for staff, parents or admins" />

      <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border bg-white p-4 shadow-sm sm:p-6">
        <FormSection title="Account">
          <Field label="Full name" htmlFor="name" required>
            <Input id="name" name="name" required value={basic.name} onChange={handleBasicChange} />
          </Field>
          <Field label="Email" htmlFor="email" required>
            <Input id="email" name="email" type="email" required value={basic.email} onChange={handleBasicChange} />
          </Field>
          <Field label="Password" htmlFor="password" required>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              value={basic.password}
              onChange={handleBasicChange}
            />
          </Field>
          <Field label="Phone number" htmlFor="phone_number">
            <Input id="phone_number" name="phone_number" type="tel" value={basic.phone_number} onChange={handleBasicChange} />
          </Field>
        </FormSection>

        <div className="space-y-2">
          <FormSection title="Personal information (optional)">
            {PERSONAL_FIELDS.map((f) => (
              <Field
                key={f.name}
                label={f.label}
                htmlFor={f.name}
                required={hasPersonalInfo}
                className={f.wide ? "md:col-span-2" : undefined}
              >
                <Input
                  id={f.name}
                  name={f.name}
                  type={f.type ?? "text"}
                  required={hasPersonalInfo}
                  value={personal[f.name]}
                  onChange={handlePersonalChange}
                />
              </Field>
            ))}
          </FormSection>
          <p className="text-xs text-muted-foreground">
            Leave this section empty, or fill in every field.
          </p>
        </div>

        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}

        <div className="flex justify-end">
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create user"}
          </Button>
        </div>
      </form>
    </div>
  );
}
