"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, Select } from "@/components/form";
import { Card, EmptyState, Loading } from "@/components/data-display";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { getParentsOfStudent, linkParent, listParents, unlinkParent } from "@/lib/students";
import type { Parent } from "@/lib/types/student";
import { fullName, getErrorMessage } from "@/lib/utils";

export default function ParentsPanel({ studentId }: { studentId: string }) {
  const linked = useQuery(`student-parents:${studentId}`, () => getParentsOfStudent(studentId));
  const allParents = useQuery("parents", listParents);
  const [selected, setSelected] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const linkedIds = new Set((linked.data ?? []).map(getId));
  const available = (allParents.data ?? []).filter((p) => !linkedIds.has(getId(p)));

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setBusy(true);
    setError("");
    try {
      await action();
      linked.reload();
      setSelected("");
    } catch (err) {
      setError(getErrorMessage(err, fallback));
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = (parent: Parent) => {
    if (!window.confirm(`Unlink ${fullName(parent)} from this student?`)) return;
    run(() => unlinkParent(getId(parent), studentId), "Failed to unlink parent");
  };

  return (
    <Card
      title="Parents & guardians"
      action={
        <Button size="sm" variant="outline" asChild>
          <Link href={`/dashboard/parents/new?student=${studentId}`}>+ New parent</Link>
        </Button>
      }
    >
      <div className="space-y-4">
        {(error || linked.error) && <Alert type="error">{error || linked.error}</Alert>}

        {linked.loading ? (
          <Loading />
        ) : (linked.data ?? []).length === 0 ? (
          <EmptyState>No parents linked yet.</EmptyState>
        ) : (
          <ul className="divide-y rounded-md border">
            {linked.data!.map((p) => (
              <li key={getId(p)} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <Link href={`/dashboard/parents/${getId(p)}`} className="font-medium hover:underline">
                    {fullName(p)}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {[p.phone, p.email, p.occupation].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <Button variant="outline" size="sm" disabled={busy} onClick={() => handleUnlink(p)} className="text-red-600 hover:text-red-700">
                  Unlink
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap gap-2">
          <Select
            aria-label="Existing parent"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            disabled={allParents.loading || available.length === 0}
            className="w-auto min-w-56 flex-1"
          >
            <option value="">
              {allParents.loading ? "Loading parents..." : available.length === 0 ? "No other parents to link" : "Link an existing parent..."}
            </option>
            {available.map((p) => (
              <option key={getId(p)} value={getId(p)}>
                {fullName(p)} ({p.phone})
              </option>
            ))}
          </Select>
          <Button disabled={!selected || busy} onClick={() => run(() => linkParent(selected, studentId), "Failed to link parent")}>
            Link
          </Button>
        </div>
      </div>
    </Card>
  );
}
