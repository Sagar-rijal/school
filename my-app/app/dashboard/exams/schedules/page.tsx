"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, PageHeader, Select } from "@/components/form";
import { EmptyState, Loading, StatusBadge, Table, TBody, TD, TH, THead } from "@/components/data-display";
import ClassSectionPicker from "@/components/class-section-picker";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { getId } from "@/lib/api";
import { deleteExamSchedule, listExamSchedules } from "@/lib/exams";
import { EXAM_STATUS_TONES, EXAM_STATUSES, EXAM_TYPES, type ExamSchedule } from "@/lib/types/exams";
import { formatDate, formatEnum, getErrorMessage } from "@/lib/utils";

type Filters = { year?: string; class?: string; subject?: string; type?: string; status?: string };

export default function ExamSchedulesPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = use(searchParams);
  const setFilters = useUrlFilters("/dashboard/exams/schedules", filters);
  const { years, defaultYearId } = useAcademicYears();
  const lookup = useAcademicLookup();
  const year = filters.year || defaultYearId;
  const [error, setError] = useState("");

  const exams = useQuery(year ? `exams:${year}:${filters.class}:${filters.subject}:${filters.type}:${filters.status}` : null, () =>
    listExamSchedules({
      academic_year_id: year,
      class_id: filters.class,
      subject_id: filters.subject,
      exam_type: filters.type,
      status: filters.status,
    })
  );

  const subjectOptions = filters.class
    ? lookup.subjects.filter((s) => s.class_ids?.includes(filters.class!))
    : lookup.subjects;

  const handleDelete = async (exam: ExamSchedule) => {
    if (!window.confirm(`Delete "${exam.name}"? Entered marks for this exam may be lost.`)) return;
    setError("");
    try {
      await deleteExamSchedule(getId(exam));
      exams.setData((prev) => prev?.filter((e) => getId(e) !== getId(exam)));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete exam"));
    }
  };

  const rows = [...(exams.data ?? [])].sort((a, b) => a.exam_date.localeCompare(b.exam_date) || (a.start_time ?? "").localeCompare(b.start_time ?? ""));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Exam schedules"
        description="Schedule exams and enter marks"
        action={
          <Button asChild>
            <Link href={`/dashboard/exams/schedules/new?year=${year}${filters.class ? `&class=${filters.class}` : ""}`}>+ Schedule exam</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <ClassSectionPicker
          years={years}
          value={{ year, class: filters.class ?? "", section: "" }}
          onChange={(v) => setFilters({ year: v.year, class: v.class, subject: "" })}
          classPlaceholder="All classes"
          hideSection
        />
        <Select aria-label="Subject" value={filters.subject ?? ""} onChange={(e) => setFilters({ subject: e.target.value })} className="w-auto min-w-36">
          <option value="">All subjects</option>
          {subjectOptions.map((s) => <option key={getId(s)} value={getId(s)}>{s.name}</option>)}
        </Select>
        <Select aria-label="Exam type" value={filters.type ?? ""} onChange={(e) => setFilters({ type: e.target.value })} className="w-auto min-w-36">
          <option value="">All types</option>
          {EXAM_TYPES.map((t) => <option key={t} value={t}>{formatEnum(t)}</option>)}
        </Select>
        <Select aria-label="Status" value={filters.status ?? ""} onChange={(e) => setFilters({ status: e.target.value })} className="w-auto min-w-32">
          <option value="">Any status</option>
          {EXAM_STATUSES.map((s) => <option key={s} value={s}>{formatEnum(s)}</option>)}
        </Select>
      </div>

      {(error || exams.error) && <Alert type="error">{error || exams.error}</Alert>}

      {exams.loading || lookup.loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState>No exams for this selection.</EmptyState>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Exam</TH>
              <TH>Class</TH>
              <TH>Date & time</TH>
              <TH>Marks</TH>
              <TH>Status</TH>
              <TH />
            </tr>
          </THead>
          <TBody>
            {rows.map((exam) => (
              <tr key={getId(exam)} className="hover:bg-muted/30">
                <TD>
                  <p className="font-medium">{exam.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {lookup.subjectName(exam.subject_id)} · {formatEnum(exam.exam_type)}
                  </p>
                </TD>
                <TD>
                  {lookup.className(exam.class_id)}
                  <span className="text-muted-foreground"> · {exam.section_id ? `Section ${lookup.sectionName(exam.section_id)}` : "All sections"}</span>
                </TD>
                <TD>
                  {formatDate(exam.exam_date)}
                  {exam.start_time && <span className="text-muted-foreground"> · {exam.start_time}{exam.end_time ? `–${exam.end_time}` : ""}</span>}
                </TD>
                <TD>
                  {exam.passing_marks}/{exam.max_marks}
                  <span className="text-xs text-muted-foreground"> to pass</span>
                </TD>
                <TD><StatusBadge value={exam.status ?? "SCHEDULED"} tones={EXAM_STATUS_TONES} /></TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" asChild>
                      <Link href={`/dashboard/exams/schedules/${getId(exam)}/marks`}>Marks</Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/exams/schedules/${getId(exam)}`}>Edit</Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(exam)} className="text-red-600 hover:text-red-700">Delete</Button>
                  </div>
                </TD>
              </tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
