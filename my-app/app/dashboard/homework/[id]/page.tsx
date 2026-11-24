"use client";

import { use, useState } from "react";
import type { SubmitEvent } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/components/session-provider";
import { Alert, PageHeader } from "@/components/form";
import { Card, EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@/hooks/use-query";
import { matchesAssignment, useTeacherAssignments } from "@/hooks/use-teacher-assignments";
import { hasPermission } from "@/lib/access";
import { getId } from "@/lib/api";
import { deleteHomework, getHomework, gradeHomeworkSubmission, listHomeworkSubmissions, type HomeworkSubmission } from "@/lib/homework";
import { getErrorMessage } from "@/lib/utils";

function GradeForm({ submission, maxPoints, onSaved }: { submission: HomeworkSubmission; maxPoints: number; onSaved: () => void }) {
  const [marks, setMarks] = useState(submission.marks_obtained == null ? "" : String(submission.marks_obtained));
  const [feedback, setFeedback] = useState(submission.feedback ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const save = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault(); setError("");
    const id = getId(submission);
    const score = Number(marks);
    if (!id || marks === "" || !Number.isFinite(score) || score < 0 || score > maxPoints) {
      setError(`Enter a score between 0 and ${maxPoints}.`); return;
    }
    setBusy(true);
    try { await gradeHomeworkSubmission(id, { marks_obtained: score, feedback: feedback.trim() || null }); onSaved(); }
    catch (err) { setError(getErrorMessage(err, "Could not save grade")); }
    finally { setBusy(false); }
  };
  return <form onSubmit={save} className="space-y-2">
    {error && <Alert type="error">{error}</Alert>}
    <div className="flex flex-wrap items-center gap-2"><Input aria-label="Marks obtained" type="number" min={0} max={maxPoints} step="any" required value={marks} onChange={(e) => setMarks(e.target.value)} className="w-24" /><span className="text-xs text-muted-foreground">/ {maxPoints}</span><Input aria-label="Feedback" placeholder="Feedback" value={feedback} onChange={(e) => setFeedback(e.target.value)} className="min-w-40 flex-1" /><Button type="submit" size="sm" disabled={busy}>{busy ? "Saving..." : "Save grade"}</Button></div>
  </form>;
}

export default function HomeworkDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const session = useSession();
  const teacherAssignments = useTeacherAssignments();
  const homework = useQuery(`homework-detail:${id}`, () => getHomework(id));
  const item = homework.data;
  const assigned = !teacherAssignments.teacher || !!item && matchesAssignment(teacherAssignments.assignments, item.academic_year_id, item.class_id, item.section_id, item.subject_id);
  const submissions = useQuery(item && !teacherAssignments.loading && assigned ? `homework-submissions:${id}` : null, () => listHomeworkSubmissions(id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const canManage = !!session && hasPermission(session, "homework:manage") && assigned;
  const remove = async () => {
    if (!canManage || !window.confirm("Delete this assignment and its submissions?")) return;
    setBusy(true); setError("");
    try { await deleteHomework(id); router.push("/dashboard/homework"); }
    catch (err) { setError(getErrorMessage(err, "Could not delete homework")); setBusy(false); }
  };
  return <div className="mx-auto max-w-5xl space-y-5">
    <PageHeader title={item?.title ?? "Homework"} description="Assignment and student work" backHref="/dashboard/homework" action={canManage && <Button variant="destructive" disabled={busy} onClick={remove}>{busy ? "Deleting..." : "Delete assignment"}</Button>} />
    {(homework.error || teacherAssignments.error || submissions.error || error) && <Alert type="error">{homework.error || teacherAssignments.error || submissions.error || error}</Alert>}
    {teacherAssignments.teacher && item && !teacherAssignments.loading && !assigned ? <Alert type="error">This assignment is not assigned to you.</Alert> : <>
    {homework.loading ? <Loading /> : item && <Card title="Assignment"><div className="grid gap-3 text-sm sm:grid-cols-2"><p><strong>Due:</strong> {new Date(item.due_date).toLocaleString()}</p><p><strong>Maximum points:</strong> {item.max_points}</p><p className="sm:col-span-2">{item.description}</p></div></Card>}
    <Card title="Submissions">{teacherAssignments.loading || submissions.loading ? <Loading /> : (submissions.data?.length ?? 0) === 0 ? <EmptyState>No submissions yet.</EmptyState> : <Table><THead><tr><TH>Student</TH><TH>Work</TH><TH>Submitted</TH><TH>Grade</TH></tr></THead><TBody>{submissions.data?.map((submission, index) => <tr key={getId(submission) || index}><TD>{submission.student_id}</TD><TD><p className="whitespace-pre-wrap">{submission.content}</p>{submission.attachment_urls?.map((url, attachmentIndex) => <p key={attachmentIndex}><a href={url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Attachment {attachmentIndex + 1}</a></p>)}</TD><TD>{submission.submitted_at ? new Date(submission.submitted_at).toLocaleString() : "—"}</TD><TD>{canManage ? <GradeForm submission={submission} maxPoints={item?.max_points ?? 100} onSaved={submissions.reload} /> : submission.marks_obtained == null ? "Not graded" : `${submission.marks_obtained} / ${item?.max_points ?? 100}`}</TD></tr>)}</TBody></Table>}</Card>
    </>}
  </div>;
}
