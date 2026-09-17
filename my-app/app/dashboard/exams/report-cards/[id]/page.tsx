"use client";

import { use } from "react";
import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, PageHeader } from "@/components/form";
import { DetailList, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useQuery } from "@/hooks/use-query";
import { getReportCard, reportCardSubjects, reportCardSummary } from "@/lib/exams";
import { getStudent, studentLabel } from "@/lib/students";
import { formatEnum } from "@/lib/utils";

export default function ReportCardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const lookup = useAcademicLookup();
  const card = useQuery(`report-card:${id}`, () => getReportCard(id));
  const student = useQuery(card.data ? `student:${card.data.student_id}` : null, () => getStudent(card.data!.student_id));

  const data = card.data;
  const summary = data ? reportCardSummary(data) : null;
  const subjects = data ? reportCardSubjects(data, lookup.subjectName) : [];

  return (
    <div className="max-w-3xl space-y-4">
      <div className="print:hidden">
        <PageHeader
          title="Report card"
          backHref={data ? `/dashboard/exams/report-cards?year=${data.academic_year_id}&class=${data.class_id}&section=${data.section_id}&type=${data.exam_type}` : "/dashboard/exams/report-cards"}
          action={
            <Button variant="outline" onClick={() => window.print()} disabled={!data}>
              <Printer /> Print
            </Button>
          }
        />
      </div>

      {card.error && <Alert type="error">{card.error}</Alert>}
      {(card.loading || lookup.loading) && <Loading />}

      {data && summary && !lookup.loading && (
        <article className="space-y-6 rounded-lg border bg-card p-6 print:border-0 print:p-0">
          <header className="border-b pb-4 text-center">
            <p className="text-sm uppercase tracking-widest text-muted-foreground">Report card</p>
            <h1 className="text-2xl font-bold">{student.data ? studentLabel(student.data) : "Student"}</h1>
            <p className="text-sm text-muted-foreground">
              {data.exam_type ? formatEnum(data.exam_type) : ""} · {lookup.yearName(data.academic_year_id)}
            </p>
          </header>

          <DetailList
            items={[
              { label: "Admission no.", value: student.data?.admission_number },
              { label: "Class", value: `${lookup.className(data.class_id)} · Section ${lookup.sectionName(data.section_id)}` },
              { label: "Status", value: summary.published ? "Published" : "Draft (not yet published)" },
            ]}
          />

          {subjects.length > 0 ? (
            <Table className="print:rounded-none">
              <THead>
                <tr>
                  <TH>Subject</TH>
                  <TH className="text-right">Marks</TH>
                  <TH className="text-right">Grade</TH>
                </tr>
              </THead>
              <TBody>
                {subjects.map((s, i) => (
                  <tr key={`${s.subject}-${i}`}>
                    <TD>{s.subject}</TD>
                    <TD className="text-right">{s.absent ? "Absent" : s.obtained != null ? `${s.obtained}${s.max != null ? ` / ${s.max}` : ""}` : "—"}</TD>
                    <TD className="text-right font-semibold">{s.grade ?? "—"}</TD>
                  </tr>
                ))}
              </TBody>
            </Table>
          ) : (
            <p className="text-sm text-muted-foreground">Subject-wise marks aren&apos;t included in this report card.</p>
          )}

          <div className="grid grid-cols-2 gap-4 border-t pt-4 text-center sm:grid-cols-4">
            <div>
              <p className="text-xs uppercase text-muted-foreground">Total</p>
              <p className="text-lg font-semibold">{summary.obtained != null ? `${summary.obtained}${summary.max != null ? `/${summary.max}` : ""}` : "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Percentage</p>
              <p className="text-lg font-semibold">{summary.percentage != null ? `${Math.round(summary.percentage * 10) / 10}%` : "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Grade</p>
              <p className="text-lg font-semibold">{summary.grade ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs uppercase text-muted-foreground">Section rank</p>
              <p className="text-lg font-semibold">{summary.rank ?? "—"}</p>
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
