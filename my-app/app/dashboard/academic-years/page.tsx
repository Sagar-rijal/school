"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, PageHeader } from "@/components/form";
import { listAcademicYears, updateAcademicYear } from "@/lib/academic";
import { getId } from "@/lib/api";
import type { AcademicYear } from "@/lib/types/academic";
import { formatDate, getErrorMessage } from "@/lib/utils";

function sortNewestFirst(years: AcademicYear[]) {
  return [...years].sort((a, b) => b.start_date.localeCompare(a.start_date));
}

export default function AcademicYearsPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(
    () =>
      listAcademicYears()
        .then((data) => setYears(sortNewestFirst(data ?? [])))
        .catch((err) => setError(getErrorMessage(err, "Failed to load academic years")))
        .finally(() => setLoading(false)),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  const setCurrent = async (year: AcademicYear) => {
    const id = getId(year);
    setUpdatingId(id);
    setError("");
    try {
      await updateAcademicYear(id, { is_current: true });
      // Reload so the list reflects whatever the backend did with the previous current year
      await load();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to set current year"));
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Academic years"
        description="Sessions that classes, enrollments, fees and exams belong to"
        action={
          <Button asChild>
            <Link href="/dashboard/academic-years/new">+ Add academic year</Link>
          </Button>
        }
      />

      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

      {loading ? (
        <p className="text-muted-foreground">Loading academic years...</p>
      ) : years.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No academic years yet. Create one before adding classes or students.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {years.map((year) => {
            const id = getId(year);
            return (
              <li key={id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{year.name}</p>
                    {year.is_current && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                        Current
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(year.start_date)} – {formatDate(year.end_date)}
                  </p>
                </div>

                <div className="flex gap-2">
                  {!year.is_current && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updatingId !== null}
                      onClick={() => setCurrent(year)}
                    >
                      {updatingId === id ? "Updating..." : "Set as current"}
                    </Button>
                  )}
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/academic-years/${id}/edit`}>Edit</Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
