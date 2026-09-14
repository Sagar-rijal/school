"use client";

import { useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import { Check, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/form";
import { createSection, deleteSection, listSections, updateSection } from "@/lib/academic";
import { getId } from "@/lib/api";
import type { Section } from "@/lib/types/academic";
import { getErrorMessage } from "@/lib/utils";

const DEFAULT_CAPACITY = 40; // backend default

function sortByName(sections: Section[]) {
  return [...sections].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}

export default function SectionsManager({ classId }: { classId: string }) {
  const [sections, setSections] = useState<Section[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Add form
  const [newName, setNewName] = useState("");
  const [newCapacity, setNewCapacity] = useState(String(DEFAULT_CAPACITY));

  // Inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCapacity, setEditCapacity] = useState("");

  useEffect(() => {
    listSections({ class_id: classId })
      .then((data) => setSections(sortByName(data ?? [])))
      .catch((err) => setError(getErrorMessage(err, "Failed to load sections")));
  }, [classId]);

  /** Runs a mutation, then reloads the list from the backend. */
  const run = async (action: () => Promise<unknown>, fallbackError: string) => {
    setBusy(true);
    setError("");
    try {
      await action();
      setSections(sortByName((await listSections({ class_id: classId })) ?? []));
      return true;
    } catch (err) {
      setError(getErrorMessage(err, fallbackError));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleAdd = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const ok = await run(
      () => createSection({ class_id: classId, name: newName.trim(), capacity: Number(newCapacity) || DEFAULT_CAPACITY }),
      "Failed to add section"
    );
    if (ok) {
      setNewName("");
      setNewCapacity(String(DEFAULT_CAPACITY));
    }
  };

  const startEdit = (section: Section) => {
    setEditingId(getId(section));
    setEditName(section.name);
    setEditCapacity(String(section.capacity));
  };

  const handleSaveEdit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingId) return;
    const ok = await run(
      () => updateSection(editingId, { name: editName.trim(), capacity: Number(editCapacity) || DEFAULT_CAPACITY }),
      "Failed to update section"
    );
    if (ok) setEditingId(null);
  };

  const handleDelete = (section: Section) => {
    if (!window.confirm(`Delete section "${section.name}"?`)) return;
    run(() => deleteSection(getId(section)), "Failed to delete section");
  };

  return (
    <div className="space-y-4">
      {error && <Alert type="error">{error}</Alert>}

      {sections === null ? (
        !error && <p className="text-muted-foreground">Loading sections...</p>
      ) : sections.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No sections yet. Add the first one below.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-white">
          {sections.map((section) => {
            const id = getId(section);
            return (
              <li key={id} className="p-3 sm:px-4">
                {editingId === id ? (
                  <form onSubmit={handleSaveEdit} className="flex flex-wrap items-center gap-2">
                    <Input
                      aria-label="Section name"
                      required
                      autoFocus
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-40 flex-1"
                    />
                    <Input
                      aria-label="Capacity"
                      type="number"
                      min={1}
                      required
                      value={editCapacity}
                      onChange={(e) => setEditCapacity(e.target.value)}
                      className="w-24"
                    />
                    <Button type="submit" size="icon-sm" disabled={busy} aria-label="Save">
                      <Check />
                    </Button>
                    <Button type="button" variant="outline" size="icon-sm" onClick={() => setEditingId(null)} aria-label="Cancel">
                      <X />
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">Section {section.name}</p>
                      <p className="text-sm text-muted-foreground">Capacity {section.capacity}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon-sm" disabled={busy} onClick={() => startEdit(section)} aria-label={`Edit section ${section.name}`}>
                        <Pencil />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        disabled={busy}
                        onClick={() => handleDelete(section)}
                        aria-label={`Delete section ${section.name}`}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex flex-wrap items-end gap-3 rounded-lg border bg-white p-4">
        <div className="min-w-40 flex-1 space-y-1.5">
          <label htmlFor="new-section-name" className="text-sm font-medium">Section name</label>
          <Input id="new-section-name" required placeholder="A" value={newName} onChange={(e) => setNewName(e.target.value)} />
        </div>
        <div className="w-28 space-y-1.5">
          <label htmlFor="new-section-capacity" className="text-sm font-medium">Capacity</label>
          <Input
            id="new-section-capacity"
            type="number"
            min={1}
            required
            value={newCapacity}
            onChange={(e) => setNewCapacity(e.target.value)}
          />
        </div>
        <Button type="submit" disabled={busy}>
          {busy ? "Saving..." : "+ Add section"}
        </Button>
      </form>
    </div>
  );
}
