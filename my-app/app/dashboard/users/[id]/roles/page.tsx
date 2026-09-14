"use client";

import { use, useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field, PageHeader, Select } from "@/components/form";
import { getId } from "@/lib/api";
import { assignRole, getUserRoles, revokeRole } from "@/lib/roles";
import { getAllSchools } from "@/lib/school";
import type { School } from "@/lib/types/school";
import { PLATFORM_ROLES, ROLE_NAMES, type RoleName, type UserRole } from "@/lib/types/user";
import { getErrorMessage } from "@/lib/utils";

const formatRole = (role: string) => role.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c) => c.toUpperCase());

export default function UserRolesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: userId } = use(params);

  const [roles, setRoles] = useState<UserRole[] | null>(null);
  const [schools, setSchools] = useState<School[] | null>(null);
  const [schoolsUnavailable, setSchoolsUnavailable] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [role, setRole] = useState<RoleName>("SCHOOL_ADMIN");
  const [schoolId, setSchoolId] = useState("");

  const needsSchool = !PLATFORM_ROLES.includes(role);

  useEffect(() => {
    getUserRoles(userId)
      .then(setRoles)
      .catch((err) => setError(getErrorMessage(err, "Failed to load roles")));

    // Listing schools may be restricted to super admins; fall back to typing the school ID
    getAllSchools()
      .then(setSchools)
      .catch(() => setSchoolsUnavailable(true));
  }, [userId]);

  const schoolName = (id: string | null) => {
    if (!id) return "All schools (platform)";
    const school = schools?.find((s) => getId(s) === id);
    return school?.school_info?.name ?? id;
  };

  /** Runs a change, then reloads the roles from the backend. */
  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setBusy(true);
    setError("");
    try {
      await action();
      setRoles(await getUserRoles(userId));
      return true;
    } catch (err) {
      setError(getErrorMessage(err, fallback));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleAssign = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (needsSchool && !schoolId.trim()) {
      setError("Select a school for this role.");
      return;
    }
    await run(
      () => assignRole({ user_id: userId, role, school_id: needsSchool ? schoolId.trim() : null }),
      "Failed to assign role"
    );
  };

  const handleRevoke = (r: UserRole) => {
    if (!window.confirm(`Remove the ${formatRole(r.role)} role (${schoolName(r.school_id)})?`)) return;
    run(
      () => revokeRole({ user_id: userId, role: r.role as RoleName, school_id: r.school_id }),
      "Failed to revoke role"
    );
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="User roles" description={`User ID: ${userId}`} backHref="/dashboard/users" />

      {error && <Alert type="error">{error}</Alert>}

      <section className="space-y-3">
        <h2 className="font-semibold">Current roles</h2>
        {roles === null ? (
          !error && <p className="text-muted-foreground">Loading roles...</p>
        ) : roles.length === 0 ? (
          <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            This user has no roles yet, so they can&apos;t access anything.
          </p>
        ) : (
          <ul className="divide-y rounded-lg border bg-white">
            {roles.map((r) => (
              <li key={`${r.role}-${r.school_id}`} className="flex items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <p className="font-medium">{formatRole(r.role)}</p>
                  <p className="truncate text-sm text-muted-foreground">{schoolName(r.school_id)}</p>
                  {r.permissions.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">{r.permissions.join(", ")}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="icon-sm"
                  disabled={busy}
                  onClick={() => handleRevoke(r)}
                  aria-label={`Revoke ${formatRole(r.role)}`}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <form onSubmit={handleAssign} className="space-y-4 rounded-lg border bg-white p-4 sm:p-6">
        <h2 className="font-semibold">Assign a role</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Role" htmlFor="role" required>
            <Select id="role" value={role} onChange={(e) => setRole(e.target.value as RoleName)}>
              {ROLE_NAMES.map((r) => (
                <option key={r} value={r}>
                  {formatRole(r)}
                </option>
              ))}
            </Select>
          </Field>

          {needsSchool && (
            <Field label="School" htmlFor="school_id" required>
              {schoolsUnavailable ? (
                <Input
                  id="school_id"
                  placeholder="School ID"
                  className="font-mono"
                  value={schoolId}
                  onChange={(e) => setSchoolId(e.target.value)}
                />
              ) : (
                <Select id="school_id" value={schoolId} onChange={(e) => setSchoolId(e.target.value)} disabled={!schools}>
                  <option value="">{schools ? "Select a school" : "Loading schools..."}</option>
                  {schools?.map((s) => (
                    <option key={getId(s)} value={getId(s)}>
                      {s.school_info?.name}
                    </option>
                  ))}
                </Select>
              )}
            </Field>
          )}
        </div>
        {!needsSchool && (
          <p className="text-sm text-muted-foreground">Super admins manage the whole platform, so no school is needed.</p>
        )}
        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>
            {busy ? "Saving..." : "Assign role"}
          </Button>
        </div>
      </form>
    </div>
  );
}
