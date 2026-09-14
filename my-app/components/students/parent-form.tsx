"use client";

import { useState } from "react";
import type { ChangeEvent, SubmitEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field, FormSection } from "@/components/form";
import type { Parent, ParentUpdatePayload } from "@/lib/types/student";
import { emptyToNull, getErrorMessage } from "@/lib/utils";

type Props = {
  initialData?: Parent;
  /** Shown on create only: login account for the parent portal. */
  showUserId?: boolean;
  submitLabel: string;
  onSubmit: (payload: ParentUpdatePayload & { first_name: string; last_name: string; phone: string; user_id: string | null }) => Promise<unknown>;
};

export default function ParentForm({ initialData, showUserId, submitLabel, onSubmit }: Props) {
  const [form, setForm] = useState({
    first_name: initialData?.first_name ?? "",
    last_name: initialData?.last_name ?? "",
    phone: initialData?.phone ?? "",
    email: initialData?.email ?? "",
    occupation: initialData?.occupation ?? "",
    address: initialData?.address ?? "",
    profile_photo_url: initialData?.profile_photo_url ?? "",
    user_id: initialData?.user_id ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await onSubmit({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        email: emptyToNull(form.email.toLowerCase()),
        occupation: emptyToNull(form.occupation),
        address: emptyToNull(form.address),
        profile_photo_url: emptyToNull(form.profile_photo_url),
        user_id: emptyToNull(form.user_id),
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save parent"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 rounded-lg border bg-white p-4 shadow-sm sm:p-6">
      <FormSection title="Parent / guardian">
        <Field label="First name" htmlFor="first_name" required>
          <Input id="first_name" name="first_name" required value={form.first_name} onChange={handleChange} />
        </Field>
        <Field label="Last name" htmlFor="last_name" required>
          <Input id="last_name" name="last_name" required value={form.last_name} onChange={handleChange} />
        </Field>
        <Field label="Phone" htmlFor="phone" required>
          <Input id="phone" name="phone" type="tel" required value={form.phone} onChange={handleChange} />
        </Field>
        <Field label="Email" htmlFor="email">
          <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} />
        </Field>
        <Field label="Occupation" htmlFor="occupation">
          <Input id="occupation" name="occupation" value={form.occupation} onChange={handleChange} />
        </Field>
        <Field label="Address" htmlFor="address">
          <Input id="address" name="address" value={form.address} onChange={handleChange} />
        </Field>
        <Field label="Profile photo URL" htmlFor="profile_photo_url" className="md:col-span-2">
          <Input id="profile_photo_url" name="profile_photo_url" type="url" placeholder="https://..." value={form.profile_photo_url} onChange={handleChange} />
        </Field>
        {showUserId && (
          <Field label="Login user ID" htmlFor="user_id" hint="Optional: link a login account for the parent" className="md:col-span-2">
            <Input id="user_id" name="user_id" className="font-mono" value={form.user_id} onChange={handleChange} />
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
