"use client";

import Link from "next/link";
import { Alert } from "@/components/form";
import { Card, EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { getStudentReportCards, getStudentResults, listExamSchedules, reportCardSummary, resultPassed } from "@/lib/exams";
import { cn, formatDate, formatEnum } from "@/lib/utils";

/** A student's exam results and report cards. */
export default function ResultsCard({ studentId }: { studentId: string }) {
  const lookup = useAcademicLookup();
  const results = useQuery(`student-results:${studentId}`, () => getStudentResults(studentId));
  const cards = useQuery(`student-report-cards:${studentId}`, () => getStudentReportCards(studentId));
  // Results reference exams by ID; load schedules to show exam names and dates
  const exams = useQuery("exams:all", () => listExamSchedules());
  const examById = new Map((exams.data ?? []).map((e) => [getId(e), e]));

  const rows = (results.data ?? [])
    .map((r) => ({ result: r, exam: examById.get(r.exam_id) }))
    .sort((a, b) => (b.exam?.exam_date ?? "").localeCompare(a.exam?.exam_date ?? ""));

  return (
    <Card title="Exam results">
      <div className="space-y-4">
        {(results.error || cards.error) && <Alert type="error">{results.error || cards.error}</Alert>}

        {(cards.data ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {cards.data!.map((card) => {
              const s = reportCardSummary(card);
              return (
                <Link
                  key={getId(card)}
                  href={`/dashboard/exams/report-cards/${getId(card)}`}
                  className="rounded-md border px-3 py-2 text-sm transition-colors hover:bg-accent"
                >
                  <span className="font-medium">{card.exam_type ? formatEnum(card.exam_type) : "Report card"}</span>
                  <span className="text-muted-foreground">
                    {" "}· {lookup.yearName(card.academic_year_id)}
                    {s.percentage != null ? ` · ${Math.round(s.percentage)}%` : ""}
                    {s.grade ? ` · ${s.grade}` : ""}
                  </span>
                </Link>
              );
            })}
          </div>
        )}

        {results.loading || exams.loading || lookup.loading ? (
          <Loading />
        ) : rows.length === 0 ? (
          <EmptyState>No exam results yet.</EmptyState>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Exam</TH>
                <TH>Date</TH>
                <TH className="text-right">Marks</TH>
                <TH>Result</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map(({ result, exam }) => {
                const passed = resultPassed(result);
                return (
                  <tr key={getId(result) || result.exam_id}>
                    <TD>
                      <p className="font-medium">{exam?.name ?? "Exam"}</p>
                      {exam && <p className="text-xs text-muted-foreground">{lookup.subjectName(exam.subject_id)}</p>}
                    </TD>
                    <TD>{formatDate(exam?.exam_date)}</TD>
                    <TD className="text-right">
                      {result.is_absent ? "Absent" : result.is_exempted ? "Exempt" : `${result.marks_obtained ?? "—"}${exam ? ` / ${exam.max_marks}` : ""}`}
                    </TD>
                    <TD className="whitespace-nowrap">
                      {result.grade && <span className="font-semibold">{result.grade} </span>}
                      {passed != null && <span className={cn("text-xs font-medium", passed ? "text-green-700" : "text-red-700")}>{passed ? "Pass" : "Fail"}</span>}
                    </TD>
                  </tr>
                );
              })}
            </TBody>
          </Table>
        )}
      </div>
    </Card>
  );
}
