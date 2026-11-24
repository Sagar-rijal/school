"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import FamilyPage, { type FamilyContext } from "@/components/family/family-page";
import { Alert, Field } from "@/components/form";
import { Card, EmptyState, Loading, StatusBadge } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useQuery } from "@/hooks/use-query";
import { ApiError, getId } from "@/lib/api";
import { fileContentUrl, uploadFile } from "@/lib/files";
import { getMyHomeworkSubmission, listHomework, submitHomework, type Homework } from "@/lib/homework";
import { cn, formatDate, getErrorMessage, todayInput } from "@/lib/utils";

function SubmissionPanel({ homework, studentId, canSubmit }: { homework: Homework; studentId: string; canSubmit: boolean }) {
  const id = getId(homework);
  const mine = useQuery(canSubmit ? `my-submission:${id}` : null, () =>
    getMyHomeworkSubmission(id).catch((err) => {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    })
  );
  const [content, setContent] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [link, setLink] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); setError("");
    if (!content.trim()) { setError("Write your answer or a note for your teacher."); return; }
    setBusy(true);
    try {
      const uploaded = await Promise.all(files.map((f) => uploadFile(f, "homework_submission", studentId)));
      await submitHomework(id, { content: content.trim(), attachment_urls: [...uploaded.map(fileContentUrl), ...(link.trim() ? [link.trim()] : [])] });
      setContent(""); setFiles([]); setLink(""); mine.reload();
    } catch (err) { setError(getErrorMessage(err, "Could not submit homework")); }
    finally { setBusy(false); }
  };

  if (!canSubmit) return null;
  if (mine.loading) return <Loading />;
  const sub = mine.data;

  if (sub) {
    return (
      <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="font-medium">Your submission{sub.submitted_at ? ` · ${new Date(sub.submitted_at).toLocaleString()}` : ""}</span>
          <StatusBadge value={sub.marks_obtained != null ? "GRADED" : sub.status ?? "SUBMITTED"} tones={{ GRADED: "green", SUBMITTED: "blue", LATE: "yellow" }} />
        </div>
        <p className="whitespace-pre-wrap">{sub.content}</p>
        {(sub.attachment_urls ?? []).length > 0 && (
          <ul className="flex flex-wrap gap-3">{sub.attachment_urls!.map((u, i) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer" className="text-primary underline">Attachment {i + 1}</a></li>)}</ul>
        )}
        {sub.marks_obtained != null && <p className="font-medium">Marks: {sub.marks_obtained} / {homework.max_points}</p>}
        {sub.feedback && <p className="text-muted-foreground">Teacher&apos;s feedback: {sub.feedback}</p>}
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-md border bg-muted/30 p-3">
      {(error || mine.error) && <Alert type="error">{error || mine.error}</Alert>}
      <Field label="Your answer" htmlFor={`hw-answer-${id}`} required>
        <textarea id={`hw-answer-${id}`} rows={4} value={content} onChange={(e) => setContent(e.target.value)} className="w-full rounded-md border border-input bg-transparent p-3 text-sm" />
      </Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Attach files" htmlFor={`hw-files-${id}`}><Input id={`hw-files-${id}`} type="file" multiple onChange={(e) => setFiles([...(e.target.files ?? [])])} /></Field>
        <Field label="Or a link" htmlFor={`hw-link-${id}`}><Input id={`hw-link-${id}`} type="url" value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." /></Field>
      </div>
      <Button type="submit" disabled={busy}>{busy ? "Submitting..." : "Submit homework"}</Button>
    </form>
  );
}

function HomeworkList({ child, isStudent }: FamilyContext) {
  const lookup = useAcademicLookup();
  const e = child.enrollment;
  const [show, setShow] = useState<"upcoming" | "all">("upcoming");
  const [openId, setOpenId] = useState("");
  const homework = useQuery(e ? `family-homework:${e.class_id}:${e.section_id}` : null, () => listHomework({ class_id: e!.class_id, section_id: e!.section_id }));
  const today = todayInput();
  const items = [...(homework.data ?? [])]
    .filter((h) => show === "all" || (h.due_date ?? "").slice(0, 10) >= today)
    .sort((a, b) => (show === "all" ? b.due_date.localeCompare(a.due_date) : a.due_date.localeCompare(b.due_date)));

  if (!e) return <EmptyState>Not enrolled in a class yet.</EmptyState>;

  return (
    <>
      {homework.error && <Alert type="error">{homework.error}</Alert>}
      <div className="flex gap-2">
        <Button variant={show === "upcoming" ? "default" : "outline"} onClick={() => setShow("upcoming")}>Due soon</Button>
        <Button variant={show === "all" ? "default" : "outline"} onClick={() => setShow("all")}>All</Button>
      </div>
      {homework.loading ? <Loading /> : items.length === 0 ? <EmptyState>{show === "upcoming" ? "No homework due. 🎉" : "No homework yet."}</EmptyState> : (
        <div className="space-y-3">
          {items.map((h) => {
            const id = getId(h);
            const overdue = h.due_date.slice(0, 10) < today;
            const open = openId === id;
            return (
              <Card key={id}>
                <div className="space-y-3">
                  <button type="button" onClick={() => setOpenId(open ? "" : id)} className="flex w-full flex-wrap items-start justify-between gap-2 text-left">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">{lookup.subjectName(h.subject_id)}</p>
                      <p className="font-semibold">{h.title}</p>
                    </div>
                    <span className={cn("text-sm", overdue ? "text-red-700" : "text-muted-foreground")}>Due {formatDate(h.due_date)} · {h.max_points} pts</span>
                  </button>
                  {open && (
                    <>
                      <p className="whitespace-pre-wrap text-sm">{h.description}</p>
                      {(h.attachments ?? []).length > 0 && (
                        <ul className="flex flex-wrap gap-3 text-sm">{h.attachments!.map((a, i) => <li key={a}><a href={a} target="_blank" rel="noopener noreferrer" className="text-primary underline">Attachment {i + 1}</a></li>)}</ul>
                      )}
                      <SubmissionPanel homework={h} studentId={child.studentId} canSubmit={isStudent} />
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function FamilyHomeworkPage() {
  return <FamilyPage title="Homework" description="Assignments for your class">{(ctx) => <HomeworkList {...ctx} />}</FamilyPage>;
}
