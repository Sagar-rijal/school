"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, PageHeader } from "@/components/form";
import AcademicYearSelect from "@/components/academic-years/academic-year-select";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { deleteClass, listClasses, listSections } from "@/lib/academic";
import { getId } from "@/lib/api";
import type { SchoolClass, Section } from "@/lib/types/academic";
import { byDisplayOrder, getErrorMessage } from "@/lib/utils";

type Loaded = {
  yearId: string;
  classes: SchoolClass[];
  sectionsByClass: Record<string, Section[]>;
  error: string;
};

export default function ClassesPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { year } = use(searchParams);
  const router = useRouter();
  const { years, loading: yearsLoading, error: yearsError, defaultYearId } = useAcademicYears();
  const selectedYearId = year || defaultYearId;

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedYearId) return;
    // Sections are fetched once for the school and grouped here, instead of one request per class
    Promise.all([listClasses({ academic_year_id: selectedYearId }), listSections()])
      .then(([classes, sections]) => {
        const sectionsByClass: Record<string, Section[]> = {};
        for (const s of sections ?? []) {
          (sectionsByClass[s.class_id] ??= []).push(s);
        }
        setLoaded({ yearId: selectedYearId, classes: [...(classes ?? [])].sort(byDisplayOrder), sectionsByClass, error: "" });
      })
      .catch((err) =>
        setLoaded({ yearId: selectedYearId, classes: [], sectionsByClass: {}, error: getErrorMessage(err, "Failed to load classes") })
      );
  }, [selectedYearId]);

  const loading = yearsLoading || (!!selectedYearId && loaded?.yearId !== selectedYearId);
  const classes = loaded?.yearId === selectedYearId ? loaded.classes : [];

  const handleDelete = async (cls: SchoolClass) => {
    const id = getId(cls);
    if (!window.confirm(`Delete "${cls.name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    setActionError("");
    try {
      await deleteClass(id);
      setLoaded((prev) => prev && { ...prev, classes: prev.classes.filter((c) => getId(c) !== id) });
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to delete class"));
    } finally {
      setDeletingId(null);
    }
  };

  const error = yearsError || actionError || (loaded?.yearId === selectedYearId ? loaded.error : "");

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Classes"
        description="Classes and their sections for each academic year"
        action={
          selectedYearId && (
            <Button asChild>
              <Link href={`/dashboard/classes/new?year=${selectedYearId}`}>+ Add class</Link>
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <label htmlFor="year-filter" className="text-sm font-medium">
          Academic year
        </label>
        <AcademicYearSelect
          id="year-filter"
          years={years}
          value={selectedYearId}
          onChange={(id) => router.replace(`/dashboard/classes?year=${id}`)}
          disabled={yearsLoading}
          className="w-auto min-w-48"
        />
      </div>

      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

      {!yearsLoading && years.length === 0 && !yearsError ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          Create an academic year first.{" "}
          <Link href="/dashboard/academic-years/new" className="font-medium text-foreground underline">
            Add academic year
          </Link>
        </p>
      ) : loading ? (
        <p className="text-muted-foreground">Loading classes...</p>
      ) : classes.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          No classes in this academic year yet.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {classes.map((cls) => {
            const id = getId(cls);
            const sections = [...(loaded?.sectionsByClass[id] ?? [])].sort((a, b) =>
              a.name.localeCompare(b.name, undefined, { numeric: true })
            );
            return (
              <li key={id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 space-y-1.5">
                  <Link href={`/dashboard/classes/${id}`} className="font-semibold text-link hover:underline">
                    {cls.name}
                  </Link>
                  <div className="flex flex-wrap gap-1.5">
                    {sections.length === 0 ? (
                      <span className="text-sm text-muted-foreground">No sections</span>
                    ) : (
                      sections.map((s) => (
                        <span key={getId(s)} className="rounded-md bg-accent px-2 py-0.5 text-xs">
                          {s.name} · {s.capacity}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/classes/${id}`}>Manage sections</Link>
                  </Button>
                  <Button variant="outline" size="icon-sm" asChild aria-label={`Edit ${cls.name}`}>
                    <Link href={`/dashboard/classes/${id}/edit`}>
                      <Pencil />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Delete ${cls.name}`}
                    disabled={deletingId !== null}
                    onClick={() => handleDelete(cls)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 />
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
