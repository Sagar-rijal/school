"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, PageHeader } from "@/components/form";
import { EmptyState, Loading, StatTile, StatusBadge, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useQuery } from "@/hooks/use-query";
import { enterBulkMarks, getExamResults, getExamSchedule, resultPassed } from "@/lib/exams";
import { getRoster, studentLabel } from "@/lib/students";
import { EXAM_STATUS_TONES, type ExamResult, type MarksEntry } from "@/lib/types/exams";
import { cn, emptyToNull, formatDate, getErrorMessage } from "@/lib/utils";

type Row = { marks: string; absent: boolean; exempt: boolean; remarks: string };

export default function ExamMarksPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const lookup = useAcademicLookup();
  const exam = useQuery(`exam:${id}`, () => getExamSchedule(id));
  const e = exam.data;

  const sheetKey = e ? `marks:${id}` : null;
  const sheet = useQuery(sheetKey, async () => {
    const [roster, results] = await Promise.all([
      // An exam without a section covers every section of the class
      getRoster(e!.academic_year_id, e!.class_id, e!.section_id ?? undefined),
      getExamResults(id),
    ]);
    return { roster, results };
  });

  const resultsByStudent = useMemo(
    () => new Map<string, ExamResult>((sheet.data?.results ?? []).map((r) => [r.student_id, r])),
    [sheet.data]
  );

  const savedRows = useMemo(() => {
    const rows: Record<string, Row> = {};
    for (const entry of sheet.data?.roster ?? []) {
      const r = resultsByStudent.get(entry.studentId);
      rows[entry.studentId] = {
        marks: r?.marks_obtained != null ? String(r.marks_obtained) : "",
        absent: r?.is_absent ?? false,
        exempt: r?.is_exempted ?? false,
        remarks: r?.remarks ?? "",
      };
    }
    return rows;
  }, [sheet.data, resultsByStudent]);

  const [draft, setDraft] = useState<{ key: string; rows: Record<string, Row> } | null>(null);
  const isDirty = !!sheetKey && draft?.key === sheetKey;
  const rows = isDirty ? draft.rows : savedRows;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const updateRow = (studentId: string, patch: Partial<Row>) => {
    if (!sheetKey) return;
    setNotice("");
    setDraft({ key: sheetKey, rows: { ...rows, [studentId]: { ...rows[studentId], ...patch } } });
  };

  const max = e?.max_marks ?? 0;
  const roster = sheet.data?.roster ?? [];

  const invalid = roster.filter(({ studentId }) => {
    const r = rows[studentId];
    if (!r || r.absent || r.exempt || r.marks === "") return false;
    const v = Number(r.marks);
    return isNaN(v) || v < 0 || v > max;
  });
  const blank = roster.filter(({ studentId }) => {
    const r = rows[studentId];
    return r && !r.absent && !r.exempt && r.marks === "";
  });

  const scored = roster.map(({ studentId }) => rows[studentId]).filter((r) => r && !r.absent && !r.exempt && r.marks !== "" && !isNaN(Number(r.marks)));
  const average = scored.length ? scored.reduce((s, r) => s + Number(r.marks), 0) / scored.length : null;
  const passing = scored.filter((r) => Number(r.marks) >= (e?.passing_marks ?? 0)).length;

  const handleSave = async () => {
    if (!e) return;
    if (invalid.length) {
      setError(`Marks must be between 0 and ${max} (${invalid.length} invalid).`);
      return;
    }
    const entries: MarksEntry[] = roster
      .filter(({ studentId }) => {
        const r = rows[studentId];
        return r && (r.absent || r.exempt || r.marks !== "");
      })
      .map(({ studentId }) => {
        const r = rows[studentId];
        return {
          student_id: studentId,
          marks_obtained: r.absent || r.exempt || r.marks === "" ? null : Number(r.marks),
          is_absent: r.absent,
          is_exempted: r.exempt,
          remarks: emptyToNull(r.remarks),
        };
      });
    if (entries.length === 0) {
      setError("Enter marks for at least one student.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await enterBulkMarks({ exam_id: id, entries });
      setDraft(null);
      setNotice(`Saved marks for ${entries.length} student${entries.length === 1 ? "" : "s"}.${blank.length ? ` ${blank.length} without marks were skipped.` : ""}`);
      sheet.reload(); // fetch computed grades
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save marks"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-6xl space-y-4">
      <PageHeader
        title={e ? `Marks: ${e.name}` : "Marks"}
        description={
          e
            ? `${lookup.subjectName(e.subject_id)} · ${lookup.className(e.class_id)}${e.section_id ? ` ${lookup.sectionName(e.section_id)}` : " (all sections)"} · ${formatDate(e.exam_date)} · Max ${e.max_marks}, pass ${e.passing_marks}`
            : undefined
        }
        backHref="/dashboard/exams/schedules"
        action={e && <StatusBadge value={e.status ?? "SCHEDULED"} tones={EXAM_STATUS_TONES} />}
      />

      {(exam.error || sheet.error) && <Alert type="error">{exam.error || sheet.error}</Alert>}

      {exam.loading || sheet.loading ? (
        <Loading>Loading students...</Loading>
      ) : !e ? null : roster.length === 0 ? (
        <EmptyState>
          No students enrolled for this exam&apos;s class.{" "}
          <Link href={`/dashboard/students?year=${e.academic_year_id}&class=${e.class_id}`} className="underline">View students</Link>
        </EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile label="Students" value={roster.length} />
            <StatTile label="Entered" value={roster.length - blank.length} />
            <StatTile label="Average" value={average == null ? "—" : `${Math.round(average * 10) / 10} / ${max}`} />
            <StatTile label="Passing" value={scored.length ? `${passing} of ${scored.length}` : "—"} tone={scored.length && passing < scored.length ? "red" : undefined} />
          </div>

          <Table>
            <THead>
              <tr>
                <TH className="w-16">Roll</TH>
                <TH>Student</TH>
                <TH>Marks / {max}</TH>
                <TH>Absent</TH>
                <TH>Exempt</TH>
                <TH>Remarks</TH>
                <TH>Result</TH>
              </tr>
            </THead>
            <TBody>
              {roster.map(({ studentId, student, rollNumber }) => {
                const r = rows[studentId];
                const saved = resultsByStudent.get(studentId);
                const passed = saved ? resultPassed(saved) : null;
                const value = Number(r?.marks);
                const bad = r && !r.absent && !r.exempt && r.marks !== "" && (isNaN(value) || value < 0 || value > max);
                const label = studentLabel(student);
                return (
                  <tr key={studentId}>
                    <TD className="font-mono">{rollNumber ?? "—"}</TD>
                    <TD className="font-medium">{label}</TD>
                    <TD>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min={0}
                        max={max}
                        step="0.5"
                        aria-label={`Marks for ${label}`}
                        aria-invalid={bad || undefined}
                        disabled={r?.absent || r?.exempt}
                        value={r?.absent || r?.exempt ? "" : r?.marks ?? ""}
                        onChange={(ev) => updateRow(studentId, { marks: ev.target.value })}
                        className={cn("h-8 w-24", bad && "border-red-500")}
                      />
                    </TD>
                    <TD>
                      <input type="checkbox" className="size-4" aria-label={`${label} absent`} checked={r?.absent ?? false} onChange={(ev) => updateRow(studentId, { absent: ev.target.checked, exempt: false })} />
                    </TD>
                    <TD>
                      <input type="checkbox" className="size-4" aria-label={`${label} exempt`} checked={r?.exempt ?? false} onChange={(ev) => updateRow(studentId, { exempt: ev.target.checked, absent: false })} />
                    </TD>
                    <TD>
                      <Input aria-label={`Remarks for ${label}`} value={r?.remarks ?? ""} onChange={(ev) => updateRow(studentId, { remarks: ev.target.value })} className="h-8 min-w-36" />
                    </TD>
                    <TD className="whitespace-nowrap text-sm">
                      {saved ? (
                        <>
                          {saved.grade && <span className="font-semibold">{saved.grade}</span>}
                          {saved.percentage != null && <span className="text-muted-foreground"> {Math.round(saved.percentage)}%</span>}
                          {passed != null && (
                            <span className={cn("ml-1 text-xs font-medium", passed ? "text-green-700" : "text-red-700")}>{passed ? "Pass" : "Fail"}</span>
                          )}
                          {!saved.grade && saved.percentage == null && passed == null && <span className="text-muted-foreground">Saved</span>}
                        </>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TD>
                  </tr>
                );
              })}
            </TBody>
          </Table>

          {error && <Alert type="error">{error}</Alert>}
          {notice && <Alert type="success">{notice}</Alert>}

          <div className="sticky bottom-0 -mx-1 flex items-center justify-end gap-3 bg-gradient-to-t from-background via-background px-1 py-3">
            {isDirty && <span className="text-sm text-muted-foreground">Unsaved changes</span>}
            <Button onClick={handleSave} disabled={saving || !isDirty}>{saving ? "Saving..." : "Save marks"}</Button>
          </div>
        </>
      )}
    </div>
  );
}
