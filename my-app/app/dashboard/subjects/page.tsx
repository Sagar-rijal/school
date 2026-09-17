"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, PageHeader, Select } from "@/components/form";
import AcademicYearSelect from "@/components/academic-years/academic-year-select";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useClasses } from "@/hooks/use-classes";
import { deleteSubject, listSubjects } from "@/lib/academic";
import { getId } from "@/lib/api";
import type { Subject } from "@/lib/types/academic";
import { getErrorMessage } from "@/lib/utils";

type Loaded = { classId: string; subjects: Subject[]; error: string };

export default function SubjectsPage({ searchParams }: { searchParams: Promise<{ year?: string; class?: string }> }) {
  const params = use(searchParams);
  const router = useRouter();
  const { years, defaultYearId } = useAcademicYears();
  const { classes, classNameById, error: classesError } = useClasses();

  const yearId = params.year || defaultYearId;
  const classId = params.class ?? ""; // "" = all subjects

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [actionError, setActionError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    listSubjects({ class_id: classId || undefined })
      .then((subjects) =>
        setLoaded({ classId, subjects: [...(subjects ?? [])].sort((a, b) => a.name.localeCompare(b.name)), error: "" })
      )
      .catch((err) => setLoaded({ classId, subjects: [], error: getErrorMessage(err, "Failed to load subjects") }));
  }, [classId]);

  const isCurrent = loaded?.classId === classId;
  const subjects = isCurrent ? loaded.subjects : [];
  const error = actionError || classesError || (isCurrent ? loaded.error : "");

  const setFilters = (next: { year?: string; class?: string }) => {
    const qs = new URLSearchParams();
    const y = next.year ?? yearId;
    const c = next.class ?? classId;
    if (y) qs.set("year", y);
    if (c) qs.set("class", c);
    router.replace(`/dashboard/subjects?${qs}`);
  };

  const handleDelete = async (subject: Subject) => {
    const id = getId(subject);
    if (!window.confirm(`Delete "${subject.name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    setActionError("");
    try {
      await deleteSubject(id);
      setLoaded((prev) => prev && { ...prev, subjects: prev.subjects.filter((s) => getId(s) !== id) });
    } catch (err) {
      setActionError(getErrorMessage(err, "Failed to delete subject"));
    } finally {
      setDeletingId(null);
    }
  };

  const yearClasses = classes.filter((c) => c.academic_year_id === yearId);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Subjects"
        description="Subjects and the classes they are taught in"
        action={
          <Button asChild>
            <Link href="/dashboard/subjects/new">+ Add subject</Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <AcademicYearSelect
          id="year-filter"
          years={years}
          value={yearId}
          // Changing the year resets the class filter, since classes belong to a year
          onChange={(y) => setFilters({ year: y, class: "" })}
          className="w-auto min-w-40"
        />
        <Select
          aria-label="Filter by class"
          value={classId}
          onChange={(e) => setFilters({ class: e.target.value })}
          className="w-auto min-w-40"
        >
          <option value="">All subjects</option>
          {yearClasses.map((c) => (
            <option key={getId(c)} value={getId(c)}>
              Taught in {c.name}
            </option>
          ))}
        </Select>
      </div>

      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

      {!isCurrent ? (
        <p className="text-muted-foreground">Loading subjects...</p>
      ) : subjects.length === 0 ? (
        <p className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
          {classId ? "No subjects are linked to this class yet." : "No subjects yet."}
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {subjects.map((subject) => {
            const id = getId(subject);
            return (
              <li key={id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{subject.name}</p>
                    <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{subject.code}</span>
                  </div>
                  {subject.description && <p className="text-sm text-muted-foreground">{subject.description}</p>}
                  <div className="flex flex-wrap gap-1.5">
                    {(subject.class_ids ?? []).length === 0 ? (
                      <span className="text-sm text-muted-foreground">Not linked to any class</span>
                    ) : (
                      subject.class_ids.map((cid) => (
                        <span key={cid} className="rounded-md bg-accent px-2 py-0.5 text-xs">
                          {classNameById(cid)}
                        </span>
                      ))
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="icon-sm" asChild aria-label={`Edit ${subject.name}`}>
                    <Link href={`/dashboard/subjects/${id}/edit`}>
                      <Pencil />
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    aria-label={`Delete ${subject.name}`}
                    disabled={deletingId !== null}
                    onClick={() => handleDelete(subject)}
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
