"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, PageHeader, Select } from "@/components/form";
import { EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import ClassSectionPicker from "@/components/class-section-picker";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { useStudentNames } from "@/hooks/use-student-names";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { getId } from "@/lib/api";
import { generateReportCards, getClassReportCards, publishReportCards, reportCardSummary } from "@/lib/exams";
import { EXAM_TYPES, type ExamType } from "@/lib/types/exams";
import { formatEnum, getErrorMessage } from "@/lib/utils";

type Filters = { year?: string; class?: string; section?: string; type?: string };

export default function ReportCardsPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = use(searchParams);
  const setFilters = useUrlFilters("/dashboard/exams/report-cards", filters);
  const { years, defaultYearId } = useAcademicYears();
  const students = useStudentNames();

  const year = filters.year || defaultYearId;
  const examType = (filters.type as ExamType) || "";
  const ready = !!(year && filters.class && filters.section && examType);
  const selection = ready
    ? { academic_year_id: year, class_id: filters.class!, section_id: filters.section!, exam_type: examType as ExamType }
    : null;

  const cards = useQuery(ready ? `report-cards:${year}:${filters.class}:${filters.section}:${examType}` : null, () =>
    getClassReportCards(filters.class!, filters.section!, examType, year)
  );

  const [busy, setBusy] = useState<"generate" | "publish" | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const run = async (kind: "generate" | "publish") => {
    if (!selection) return;
    if (kind === "publish" && !window.confirm("Publish these report cards? Students and parents will be able to see them.")) return;
    setBusy(kind);
    setError("");
    setNotice("");
    try {
      await (kind === "generate" ? generateReportCards(selection) : publishReportCards(selection));
      setNotice(kind === "generate" ? "Report cards generated from the latest marks." : "Report cards published.");
      cards.reload();
    } catch (err) {
      setError(getErrorMessage(err, kind === "generate" ? "Failed to generate report cards" : "Failed to publish report cards"));
    } finally {
      setBusy(null);
    }
  };

  const rows = (cards.data ?? [])
    .map((card) => ({ card, summary: reportCardSummary(card) }))
    .sort((a, b) => (a.summary.rank ?? Infinity) - (b.summary.rank ?? Infinity) || students.name(a.card.student_id).localeCompare(students.name(b.card.student_id)));
  const allPublished = rows.length > 0 && rows.every((r) => r.summary.published);

  return (
    <div className="space-y-4">
      <PageHeader title="Report cards" description="Generate from entered marks, check, then publish" />

      <div className="flex flex-wrap items-center gap-2">
        <ClassSectionPicker
          years={years}
          value={{ year, class: filters.class ?? "", section: filters.section ?? "" }}
          onChange={(v) => setFilters({ year: v.year, class: v.class, section: v.section })}
        />
        <Select aria-label="Exam type" value={examType} onChange={(e) => setFilters({ type: e.target.value })} className="w-auto min-w-36">
          <option value="">Select exam type</option>
          {EXAM_TYPES.map((t) => <option key={t} value={t}>{formatEnum(t)}</option>)}
        </Select>
      </div>

      {!ready ? (
        <EmptyState>Select a class, section and exam type.</EmptyState>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-white p-3">
            <p className="text-sm text-muted-foreground">
              Generating (again) recalculates totals, grades and ranks from all {formatEnum(examType).toLowerCase()} marks.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" disabled={!!busy} onClick={() => run("generate")}>
                {busy === "generate" ? "Generating..." : rows.length ? "Regenerate" : "Generate"}
              </Button>
              <Button disabled={!!busy || rows.length === 0 || allPublished} onClick={() => run("publish")}>
                {busy === "publish" ? "Publishing..." : allPublished ? "Published" : "Publish"}
              </Button>
            </div>
          </div>

          {(error || cards.error) && <Alert type="error">{error || cards.error}</Alert>}
          {notice && <Alert type="success">{notice}</Alert>}

          {cards.loading || students.loading ? (
            <Loading />
          ) : rows.length === 0 ? (
            <EmptyState>No report cards yet. Enter marks for this exam type, then generate.</EmptyState>
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH className="w-16">Rank</TH>
                  <TH>Student</TH>
                  <TH>Marks</TH>
                  <TH>Percentage</TH>
                  <TH>Grade</TH>
                  <TH>Status</TH>
                  <TH />
                </tr>
              </THead>
              <TBody>
                {rows.map(({ card, summary }) => (
                  <tr key={getId(card) || card.student_id} className="hover:bg-muted/30">
                    <TD className="font-semibold">{summary.rank ?? "—"}</TD>
                    <TD className="font-medium">{students.name(card.student_id)}</TD>
                    <TD>{summary.obtained != null ? `${summary.obtained}${summary.max != null ? ` / ${summary.max}` : ""}` : "—"}</TD>
                    <TD>{summary.percentage != null ? `${Math.round(summary.percentage * 10) / 10}%` : "—"}</TD>
                    <TD className="font-semibold">{summary.grade ?? "—"}</TD>
                    <TD>
                      <span className={summary.published ? "text-green-700" : "text-muted-foreground"}>{summary.published ? "Published" : "Draft"}</span>
                    </TD>
                    <TD className="text-right">
                      {getId(card) && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/exams/report-cards/${getId(card)}`}>View</Link>
                        </Button>
                      )}
                    </TD>
                  </tr>
                ))}
              </TBody>
            </Table>
          )}
        </>
      )}
    </div>
  );
}
