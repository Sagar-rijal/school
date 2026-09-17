"use client";

import Link from "next/link";
import { Card, EmptyState, Loading } from "@/components/data-display";
import { Alert } from "@/components/form";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useQuery } from "@/hooks/use-query";
import { listAssignmentsByTeacher } from "@/lib/academic";
import { getId } from "@/lib/api";

/** Classes/sections a teacher is assigned to. Assign from a class's page. */
export default function TeacherClassesCard({ userId }: { userId?: string | null }) {
  const lookup = useAcademicLookup();
  const assignments = useQuery(userId ? `assignments:teacher:${userId}` : null, () => listAssignmentsByTeacher(userId!));

  return (
    <Card title="Class assignments">
      {!userId ? (
        <EmptyState>Link a login account (User ID below) to assign this teacher to classes.</EmptyState>
      ) : assignments.error ? (
        <Alert type="error">{assignments.error}</Alert>
      ) : assignments.loading || lookup.loading ? (
        <Loading />
      ) : (assignments.data ?? []).length === 0 ? (
        <EmptyState>Not assigned to any class. Assign teachers from a class&apos;s page.</EmptyState>
      ) : (
        <ul className="divide-y rounded-md border">
          {assignments.data!.map((a) => (
            <li key={getId(a)} className="flex items-center justify-between gap-2 p-3 text-sm">
              <Link href={`/dashboard/classes/${a.class_id}`} className="font-medium text-link hover:underline">
                {lookup.className(a.class_id)} · Section {lookup.sectionName(a.section_id)}
              </Link>
              <span className="text-muted-foreground">
                {a.subject_id ? lookup.subjectName(a.subject_id) : "Class teacher"} · {lookup.yearName(a.academic_year_id)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
