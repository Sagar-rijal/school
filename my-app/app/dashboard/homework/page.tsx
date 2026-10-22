"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";
import ClassSectionPicker, { type ClassSectionValue } from "@/components/class-section-picker";
import { useSession } from "@/components/session-provider";
import { Alert, Field, PageHeader, Select } from "@/components/form";
import { Card, EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { listSubjects } from "@/lib/academic";
import { hasPermission } from "@/lib/access";
import { getId } from "@/lib/api";
import { createHomework, listHomework } from "@/lib/homework";
import { getErrorMessage } from "@/lib/utils";

export default function HomeworkPage() {
  const session = useSession();
  const years = useAcademicYears();
  const [selection, setSelection] = useState<ClassSectionValue>({ year: "", class: "", section: "" });
  const value = { ...selection, year: selection.year || years.defaultYearId };
  const [subjectId, setSubjectId] = useState("");
  const subjects = useQuery(value.class ? `homework-subjects:${value.class}` : null, () => listSubjects({ class_id: value.class }));
  const homework = useQuery(value.class ? `homework:${value.class}:${value.section}:${subjectId}` : null,
    () => listHomework({ class_id: value.class, section_id: value.section || undefined, subject_id: subjectId || undefined }));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState("");
  const [maxPoints, setMaxPoints] = useState(100);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canManage = session ? hasPermission(session, "homework:manage") : false;

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setMessage("");
    if (!value.year || !value.class || !value.section || !subjectId || !due) {
      setError("Select an academic year, class, section, subject, and due date."); return;
    }
    if (!Number.isFinite(maxPoints) || maxPoints <= 0) { setError("Maximum points must be greater than zero."); return; }
    setBusy(true);
    try {
      await createHomework({ academic_year_id: value.year, class_id: value.class, section_id: value.section,
        subject_id: subjectId, title: title.trim(), description: description.trim(), due_date: new Date(due).toISOString(), max_points: maxPoints });
      setTitle(""); setDescription(""); setDue(""); setMessage("Homework assigned."); homework.reload();
    } catch (err) { setError(getErrorMessage(err, "Could not assign homework")); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader title="Homework" description="Assignments and student submissions" />
      {(years.error || subjects.error || homework.error || error) && <Alert type="error">{years.error || subjects.error || homework.error || error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}
      <div className="flex flex-wrap items-center gap-2"><ClassSectionPicker years={years.years} value={value} onChange={(next) => { setSelection(next); setSubjectId(""); }} />
        <Select aria-label="Subject" value={subjectId} onChange={(e) => setSubjectId(e.target.value)} disabled={!value.class || subjects.loading} className="w-auto min-w-40"><option value="">All subjects</option>{subjects.data?.map((item) => <option key={getId(item)} value={getId(item)}>{item.name}</option>)}</Select>
      </div>
      {canManage && value.section && subjectId && <Card title="Assign homework"><form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2"><Field label="Title" htmlFor="homework-title" required><Input id="homework-title" required value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
          <Field label="Due date" htmlFor="homework-due" required><Input id="homework-due" required type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
          <Field label="Maximum points" htmlFor="homework-points" required><Input id="homework-points" required type="number" min={0.01} step="any" value={maxPoints} onChange={(e) => setMaxPoints(Number(e.target.value))} /></Field>
        </div><Field label="Description" htmlFor="homework-description" required><textarea id="homework-description" rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-md border border-input bg-transparent p-3 text-sm" /></Field>
        <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Assign homework"}</Button>
      </form></Card>}
      {years.loading || homework.loading ? <Loading /> : !value.class ? <EmptyState>Select a class to view homework.</EmptyState> : (homework.data?.length ?? 0) === 0 ? <EmptyState>No homework matches these filters.</EmptyState> : <Table><THead><tr><TH>Assignment</TH><TH>Subject</TH><TH>Due</TH><TH>Points</TH><TH>Submissions</TH></tr></THead><TBody>{homework.data?.map((item, index) => <tr key={getId(item) || index}><TD><span className="font-medium">{item.title}</span><p className="text-xs text-muted-foreground">{item.description}</p></TD><TD>{subjects.data?.find((subject) => getId(subject) === item.subject_id)?.name ?? item.subject_id}</TD><TD>{new Date(item.due_date).toLocaleString()}</TD><TD>{item.max_points}</TD><TD>{getId(item) && <Button asChild size="sm" variant="outline"><Link href={`/dashboard/homework/${getId(item)}`}>View</Link></Button>}</TD></tr>)}</TBody></Table>}
    </div>
  );
}
