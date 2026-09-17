"use client";

import Link from "next/link";
import { Alert } from "@/components/form";
import { Card, EmptyState, Loading } from "@/components/data-display";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { listTeachersBySubject } from "@/lib/staff";
import { formatEnum, fullName } from "@/lib/utils";

/** Staff who teach this subject. Set on a teacher's profile under "Subjects taught". */
export default function SubjectTeachers({ subjectId }: { subjectId: string }) {
  const teachers = useQuery(`teachers:subject:${subjectId}`, () => listTeachersBySubject(subjectId));

  return (
    <Card title="Teachers">
      {teachers.error ? (
        <Alert type="error">{teachers.error}</Alert>
      ) : teachers.loading ? (
        <Loading />
      ) : (teachers.data ?? []).length === 0 ? (
        <EmptyState>
          No teachers assigned to this subject. Add it under &quot;Subjects taught&quot; on a{" "}
          <Link href="/dashboard/staff" className="underline">staff profile</Link>.
        </EmptyState>
      ) : (
        <ul className="divide-y rounded-md border text-sm">
          {teachers.data!.map((t) => (
            <li key={getId(t)} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
              <Link href={`/dashboard/staff/${getId(t)}`} className="font-medium hover:underline">
                {fullName(t)}
              </Link>
              <span className="text-muted-foreground">
                {[t.designation, t.status && t.status !== "ACTIVE" ? formatEnum(t.status) : null].filter(Boolean).join(" · ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
