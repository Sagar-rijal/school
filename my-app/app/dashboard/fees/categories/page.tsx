"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field, PageHeader } from "@/components/form";
import { EmptyState, Loading } from "@/components/data-display";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { createFeeCategory, deleteFeeCategory, listFeeCategories, updateFeeCategory } from "@/lib/fees";
import type { FeeCategory } from "@/lib/types/fees";
import { emptyToNull, getErrorMessage } from "@/lib/utils";

const EMPTY = { name: "", code: "", description: "", is_mandatory: true };

export default function FeeCategoriesPage() {
  const categories = useQuery("fee-categories", listFeeCategories);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setBusy(true);
    setError("");
    try {
      await action();
      categories.reload();
      return true;
    } catch (err) {
      setError(getErrorMessage(err, fallback));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setEditingId(null);
    setForm(EMPTY);
  };

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: emptyToNull(form.description),
      is_mandatory: form.is_mandatory,
    };
    const ok = await run(
      () => (editingId ? updateFeeCategory(editingId, payload) : createFeeCategory(payload)),
      "Failed to save category"
    );
    if (ok) reset();
  };

  const startEdit = (c: FeeCategory) => {
    setEditingId(getId(c));
    setForm({ name: c.name, code: c.code, description: c.description ?? "", is_mandatory: c.is_mandatory ?? true });
  };

  const handleDelete = (c: FeeCategory) => {
    if (!window.confirm(`Delete the ${c.name} category? Fee structures using it keep their amounts.`)) return;
    run(() => deleteFeeCategory(getId(c)), "Failed to delete category");
  };

  const rows = [...(categories.data ?? [])].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="max-w-4xl space-y-6">
      <PageHeader title="Fee categories" description="Types of fees, like Tuition, Transport or Library" />

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-card p-4 sm:p-6">
        <h2 className="font-semibold">{editingId ? "Edit category" : "Add category"}</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="cat-name" required>
            <Input id="cat-name" required placeholder="Tuition fee" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Code" htmlFor="cat-code" required>
            <Input id="cat-code" required placeholder="TUITION" className="font-mono uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
          </Field>
          <Field label="Description" htmlFor="cat-description" className="sm:col-span-2">
            <Input id="cat-description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" className="size-4" checked={form.is_mandatory} onChange={(e) => setForm({ ...form, is_mandatory: e.target.checked })} />
          Mandatory for all students
        </label>
        {error && <Alert type="error">{error}</Alert>}
        <div className="flex justify-end gap-2">
          {editingId && <Button type="button" variant="outline" onClick={reset}>Cancel</Button>}
          <Button type="submit" disabled={busy}>{busy ? "Saving..." : editingId ? "Save changes" : "Add category"}</Button>
        </div>
      </form>

      {categories.error && <Alert type="error">{categories.error}</Alert>}
      {categories.loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState>No fee categories yet.</EmptyState>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {rows.map((c) => (
            <li key={getId(c)} className="flex items-center justify-between gap-3 p-4">
              <div className="min-w-0">
                <p className="font-medium">
                  {c.name} <span className="ml-1 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{c.code}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {c.is_mandatory ? "Mandatory" : "Optional"}
                  {c.description ? ` · ${c.description}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon-sm" aria-label={`Edit ${c.name}`} disabled={busy} onClick={() => startEdit(c)}><Pencil /></Button>
                <Button variant="outline" size="icon-sm" aria-label={`Delete ${c.name}`} disabled={busy} onClick={() => handleDelete(c)} className="text-red-600 hover:text-red-700"><Trash2 /></Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
