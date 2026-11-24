"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field, PageHeader } from "@/components/form";
import { changePassword, logoutUser } from "@/lib/auth";
import { useAuthStore } from "@/store/useAuthStore";
import { getErrorMessage } from "@/lib/utils";

export default function ChangePasswordPage() {
  const router = useRouter();
  const clearAuthUser = useAuthStore((state) => state.clearAuthUser);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    if (next !== confirm) {
      setError("New passwords do not match.");
      return;
    }
    if (next === current) {
      setError("Choose a new password different from your current password.");
      return;
    }

    setBusy(true);
    try {
      await changePassword(current, next);
      setCurrent("");
      setNext("");
      setConfirm("");
      try { await logoutUser(); } catch { /* The backend has already revoked the session. */ }
      clearAuthUser();
      router.replace("/auth/login?passwordChanged=1");
    } catch (err) {
      setError(getErrorMessage(err, "Could not change password"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Change password" description="Update the password for your account" backHref="/dashboard" />
      <form onSubmit={submit} className="space-y-5 rounded-lg border bg-card p-5 sm:p-6">
        <Field label="Current password" htmlFor="current" required>
          <Input id="current" type="password" autoComplete="current-password" required value={current} onChange={(e) => setCurrent(e.target.value)} />
        </Field>
        <Field label="New password" htmlFor="next" required>
          <Input id="next" type="password" autoComplete="new-password" required value={next} onChange={(e) => setNext(e.target.value)} />
        </Field>
        <Field label="Confirm new password" htmlFor="confirm" required>
          <Input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
        </Field>
        {error && <Alert type="error">{error}</Alert>}
        <Button type="submit" disabled={busy}>{busy ? "Updating..." : "Update password"}</Button>
      </form>
    </div>
  );
}
