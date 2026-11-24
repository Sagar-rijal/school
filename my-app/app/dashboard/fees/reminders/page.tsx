"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import ClassSectionPicker, { type ClassSectionValue } from "@/components/class-section-picker";
import RosterChecklist from "@/components/fees/roster-checklist";
import { Alert, Field, PageHeader } from "@/components/form";
import { Card, DetailList, NumberStats, StatusBadge } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { createFeeStatementExport, getFeeStatementExport, previewDueNotice, sendDueNotice, type FeeStatementExport } from "@/lib/fees";
import { fileContentUrl } from "@/lib/files";
import { getRoster } from "@/lib/students";
import { getErrorMessage, todayInput } from "@/lib/utils";

const MAX_STUDENTS = 200;
const exportIdOf = (e: FeeStatementExport) => e.export_id ?? e.id ?? e._id ?? "";

export default function FeeRemindersPage() {
  const { years, defaultYearId } = useAcademicYears();
  const [selection, setSelection] = useState<ClassSectionValue>({ year: "", class: "", section: "" });
  const value = { ...selection, year: selection.year || defaultYearId };
  const roster = useQuery(value.year && value.class && value.section ? `roster:${value.year}:${value.class}:${value.section}` : null,
    () => getRoster(value.year, value.class, value.section));
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [dueBefore, setDueBefore] = useState(todayInput());
  const [preview, setPreview] = useState<unknown>(null);
  const [exportJob, setExportJob] = useState<FeeStatementExport | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const ids = [...selected];

  const run = async (action: () => Promise<void>, fallback: string) => {
    setBusy(true); setError(""); setMessage("");
    try { await action(); } catch (err) { setError(getErrorMessage(err, fallback)); } finally { setBusy(false); }
  };

  const checkSelection = () => {
    if (ids.length === 0) { setError("Select at least one student."); return false; }
    if (ids.length > MAX_STUDENTS) { setError(`Select at most ${MAX_STUDENTS} students at a time.`); return false; }
    return true;
  };

  const doPreview = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!checkSelection()) return;
    run(async () => setPreview(await previewDueNotice(ids, dueBefore)), "Could not preview reminders");
  };

  const doSend = () => {
    if (!checkSelection() || !window.confirm(`Send fee reminders to the families of ${ids.length} student(s)?`)) return;
    run(async () => { await sendDueNotice(ids, dueBefore); setMessage("Reminders sent."); setPreview(null); }, "Could not send reminders");
  };

  const startExport = () => run(async () => {
    setExportJob(await createFeeStatementExport({ academic_year_id: value.year, class_id: value.class || undefined, due_before: dueBefore }));
    setMessage("Export started. Check its status below.");
  }, "Could not start export");

  const refreshExport = () => exportJob && run(async () => setExportJob(await getFeeStatementExport(exportIdOf(exportJob))), "Could not check export");

  return (
    <div className="space-y-5">
      <PageHeader title="Reminders & statements" description="Remind families about dues and export fee statements" />
      {(error || roster.error) && <Alert type="error">{error || roster.error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      <Card title="Students">
        <div className="space-y-3">
          <ClassSectionPicker years={years} value={value} onChange={(next) => { setSelection(next); setSelected(new Set()); setPreview(null); }} />
          <RosterChecklist roster={roster.data} loading={roster.loading} selected={selected} onChange={(s) => { setSelected(s); setPreview(null); }} max={MAX_STUDENTS} />
        </div>
      </Card>

      <Card title="Due-fee reminder">
        <form onSubmit={doPreview} className="space-y-4">
          <Field label="Include invoices due on or before" htmlFor="due-before" required className="max-w-xs">
            <Input id="due-before" type="date" required value={dueBefore} onChange={(e) => { setDueBefore(e.target.value); setPreview(null); }} />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" variant="outline" disabled={busy}>Preview</Button>
            <Button type="button" disabled={busy || preview === null} onClick={doSend} title={preview === null ? "Preview first" : undefined}>Send reminders</Button>
          </div>
          {preview !== null && (
            <div className="space-y-2">
              <NumberStats data={preview} />
              <details className="text-xs"><summary className="cursor-pointer text-muted-foreground">Who will be notified</summary>
                <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3">{JSON.stringify(preview, null, 2)}</pre>
              </details>
            </div>
          )}
        </form>
      </Card>

      <Card title="Fee statement export" action={<Button size="sm" disabled={busy || !value.year} onClick={startExport}>Export {value.class ? "this class" : "whole year"}</Button>}>
        <p className="mb-3 text-sm text-muted-foreground">Builds a statement file of dues up to the date above. Large exports run in the background.</p>
        {exportJob && (
          <div className="space-y-3">
            <DetailList items={[
              { label: "Export", value: <span className="font-mono text-xs">{exportIdOf(exportJob)}</span> },
              { label: "Status", value: <StatusBadge value={exportJob.status ?? "PENDING"} tones={{ PENDING: "yellow", PROCESSING: "yellow", COMPLETED: "green", READY: "green", FAILED: "red" }} /> },
              { label: "Problem", value: exportJob.error },
            ]} />
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={busy} onClick={refreshExport}>Check status</Button>
              {(exportJob.file_id || exportJob.download_url) && (
                <Button size="sm" asChild>
                  <a href={exportJob.file_id ? fileContentUrl(exportJob.file_id) : exportJob.download_url!} target="_blank" rel="noopener noreferrer">Download</a>
                </Button>
              )}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
