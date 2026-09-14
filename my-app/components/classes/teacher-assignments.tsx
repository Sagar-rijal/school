"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, Field, Select } from "@/components/form";
import { Card, EmptyState, Loading } from "@/components/data-display";
import { useQuery } from "@/hooks/use-query";
import { assignTeacher, listAssignmentsBySection, listSections, listSubjects, removeTeacherAssignment } from "@/lib/academic";
import { getId } from "@/lib/api";
import { listStaff } from "@/lib/staff";
import type { TeacherAssignment } from "@/lib/types/academic";
import { fullName, getErrorMessage } from "@/lib/utils";

type Props = { classId: string; yearId: string };

/** Teachers assigned to each section of a class, per subject or as class teacher. */
export default function TeacherAssignments({ classId, yearId }: Props) {
  const sections = useQuery(`sections:${classId}`, async () =>
    [...((await listSections({ class_id: classId })) ?? [])].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
  );
  const teachers = useQuery("staff:teaching", () => listStaff({ staff_type: "TEACHING" }));
  const subjects = useQuery(`subjects:class:${classId}`, async () => (await listSubjects({ class_id: classId })) ?? []);

  const [chosenSection, setChosenSection] = useState("");
  const sectionId = chosenSection || (sections.data?.[0] ? getId(sections.data[0]) : "");
  const assignments = useQuery(sectionId ? `assignments:${classId}:${sectionId}` : null, () =>
    listAssignmentsBySection(classId, sectionId)
  );

  const [teacherUserId, setTeacherUserId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Assignments reference login user IDs, so only staff with a login can be assigned
  const assignable = (teachers.data ?? []).filter((t) => t.user_id && (t.status ?? "ACTIVE") === "ACTIVE");
  const teacherName = (userId: string) => {
    const t = teachers.data?.find((s) => s.user_id === userId);
    return t ? fullName(t) : `User ${userId}`;
  };
  const subjectName = (id?: string | null) =>
    id ? subjects.data?.find((s) => getId(s) === id)?.name ?? "Subject" : "Class teacher";

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setBusy(true);
    setError("");
    try {
      await action();
      assignments.reload();
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
    const ok = await run(
      () =>
        assignTeacher({
          class_id: classId,
          section_id: sectionId,
          teacher_user_id: teacherUserId,
          subject_id: subjectId || null,
          academic_year_id: yearId,
        }),
      "Failed to assign teacher"
    );
    if (ok) {
      setTeacherUserId("");
      setSubjectId("");
    }
  };

  const handleRemove = (a: TeacherAssignment) => {
    if (!window.confirm(`Remove ${teacherName(a.teacher_user_id)} (${subjectName(a.subject_id)})?`)) return;
    run(() => removeTeacherAssignment(getId(a)), "Failed to remove assignment");
  };

  // Class teacher first, then by subject name
  const rows = [...(assignments.data ?? [])].sort(
    (a, b) => Number(!!a.subject_id) - Number(!!b.subject_id) || subjectName(a.subject_id).localeCompare(subjectName(b.subject_id))
  );

  if (sections.loading) return <Card title="Teachers"><Loading /></Card>;
  if ((sections.data ?? []).length === 0) {
    return <Card title="Teachers"><EmptyState>Add a section before assigning teachers.</EmptyState></Card>;
  }

  return (
    <Card
      title="Teachers"
      action={
        <Select aria-label="Section" value={sectionId} onChange={(e) => setChosenSection(e.target.value)} className="w-auto">
          {sections.data!.map((s) => (
            <option key={getId(s)} value={getId(s)}>Section {s.name}</option>
          ))}
        </Select>
      }
    >
      <div className="space-y-4">
        {(error || assignments.error) && <Alert type="error">{error || assignments.error}</Alert>}

        {assignments.loading || teachers.loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState>No teachers assigned to this section yet.</EmptyState>
        ) : (
          <ul className="divide-y rounded-md border">
            {rows.map((a) => (
              <li key={getId(a)} className="flex items-center justify-between gap-2 p-3">
                <div>
                  <p className="font-medium">{teacherName(a.teacher_user_id)}</p>
                  <p className="text-sm text-muted-foreground">{subjectName(a.subject_id)}</p>
                </div>
                <Button variant="outline" size="icon-sm" disabled={busy} onClick={() => handleRemove(a)} aria-label="Remove assignment" className="text-red-600 hover:text-red-700">
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleAssign} className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/30 p-3">
          <Field label="Teacher" htmlFor="assign-teacher" className="min-w-48 flex-1">
            <Select id="assign-teacher" required value={teacherUserId} onChange={(e) => setTeacherUserId(e.target.value)}>
              <option value="" disabled>{assignable.length ? "Select teacher" : "No teachers with a login"}</option>
              {assignable.map((t) => (
                <option key={getId(t)} value={t.user_id!}>{fullName(t)}</option>
              ))}
            </Select>
          </Field>
          <Field label="Subject" htmlFor="assign-subject" className="min-w-40 flex-1">
            <Select id="assign-subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">Class teacher (no subject)</option>
              {subjects.data?.map((s) => <option key={getId(s)} value={getId(s)}>{s.name}</option>)}
            </Select>
          </Field>
          <Button type="submit" disabled={busy || !teacherUserId}>Assign</Button>
        </form>
        <p className="text-xs text-muted-foreground">
          Only active teaching staff with a login account are listed. Subjects shown are those linked to this class — link more on the{" "}
          <Link href="/dashboard/subjects" className="underline">Subjects</Link> page.
        </p>
      </div>
    </Card>
  );
}
