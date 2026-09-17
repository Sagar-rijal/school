"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field, PageHeader, Select } from "@/components/form";
import { EmptyState, Loading } from "@/components/data-display";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { createDepartment, deleteDepartment, listDepartments, listStaff, updateDepartment } from "@/lib/staff";
import type { Department, DepartmentPayload } from "@/lib/types/staff";
import { emptyToNull, fullName, getErrorMessage } from "@/lib/utils";

const EMPTY = { name: "", code: "", description: "", head_staff_id: "" };

export default function DepartmentsPage() {
  const departments = useQuery("departments", listDepartments);
  const staff = useQuery("staff:all", () => listStaff());

  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const staffName = (id?: string | null) => {
    const member = staff.data?.find((s) => getId(s) === id);
    return member ? fullName(member) : null;
  };

  const startEdit = (d: Department) => {
    setEditingId(getId(d));
    setForm({ name: d.name, code: d.code, description: d.description ?? "", head_staff_id: d.head_staff_id ?? "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setBusy(true);
    setError("");
    try {
      await action();
      departments.reload();
      return true;
    } catch (err) {
      setError(getErrorMessage(err, fallback));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: DepartmentPayload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: emptyToNull(form.description),
      head_staff_id: emptyToNull(form.head_staff_id),
    };
    const ok = await run(
      () => (editingId ? updateDepartment(editingId, payload) : createDepartment(payload)),
      "Failed to save department"
    );
    if (ok) cancelEdit();
  };

  const handleDelete = (d: Department) => {
    if (!window.confirm(`Delete the ${d.name} department?`)) return;
    run(() => deleteDepartment(getId(d)), "Failed to delete department");
  };

  const rows = [...(departments.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Departments" description="Group staff by department" backHref="/dashboard/staff" />

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4 sm:p-6">
        <h2 className="font-semibold">{editingId ? "Edit department" : "Add department"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="dept-name" required>
            <Input id="dept-name" required placeholder="Science" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Code" htmlFor="dept-code" required>
            <Input id="dept-code" required placeholder="SCI" className="font-mono uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          </Field>
          <Field label="Head of department" htmlFor="dept-head">
            <Select id="dept-head" value={form.head_staff_id} onChange={(e) => setForm({ ...form, head_staff_id: e.target.value })}>
              <option value="">None</option>
              {staff.data?.map((s) => <option key={getId(s)} value={getId(s)}>{fullName(s)}</option>)}
            </Select>
          </Field>
          <Field label="Description" htmlFor="dept-description">
            <Input id="dept-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
        {error && <Alert type="error">{error}</Alert>}
        <div className="flex justify-end gap-2">
          {editingId && <Button type="button" variant="outline" onClick={cancelEdit}>Cancel</Button>}
          <Button type="submit" disabled={busy}>{busy ? "Saving..." : editingId ? "Save changes" : "Add department"}</Button>
        </div>
      </form>

      {departments.error && <Alert type="error">{departments.error}</Alert>}
      {departments.loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState>No departments yet.</EmptyState>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {rows.map((d) => (
            <li key={getId(d)} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium">
                  {d.name} <span className="ml-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{d.code}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {[staffName(d.head_staff_id) && `Head: ${staffName(d.head_staff_id)}`, d.description].filter(Boolean).join(" · ") || "No description"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon-sm" aria-label={`Edit ${d.name}`} disabled={busy} onClick={() => startEdit(d)}><Pencil /></Button>
                <Button variant="outline" size="icon-sm" aria-label={`Delete ${d.name}`} disabled={busy} onClick={() => handleDelete(d)} className="text-red-600 hover:text-red-700"><Trash2 /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
