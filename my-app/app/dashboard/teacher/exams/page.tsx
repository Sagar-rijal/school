"use client";

import Link from "next/link";
import { PageHeader, Alert } from "@/components/form";
import { EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useTeacherAssignments } from "@/hooks/use-teacher-assignments";
import { useQuery } from "@/hooks/use-query";
import { listExamSchedules } from "@/lib/exams";
import { getId } from "@/lib/api";
import { formatDate } from "@/lib/utils";

export default function TeacherExamsPage() {
  const { assignments, loading, error } = useTeacherAssignments();
  const years = [...new Set(assignments.map((item) => item.academic_year_id))];
  const exams = useQuery(!loading && !error && years.length ? `teacher-exams:${years.join(",")}` : null,
    async () => (await Promise.all(years.map((year) => listExamSchedules({ academic_year_id: year })))).flat());
  const lookup = useAcademicLookup();
  const mine = (exams.data ?? []).filter((exam) => exam.status !== "CANCELLED" && assignments.some((item) =>
    item.academic_year_id === exam.academic_year_id && item.class_id === exam.class_id &&
    (!item.subject_id || item.subject_id === exam.subject_id) &&
    (!exam.section_id || item.section_id === exam.section_id)));
  return <div className="mx-auto max-w-5xl space-y-5"><PageHeader title="Enter marks" description="Exams for your assigned classes and subjects" backHref="/dashboard/teacher" />
    {(error || exams.error) && <Alert type="error">{error || exams.error}</Alert>}
    {loading || exams.loading ? <Loading /> : !mine.length ? <EmptyState>No exams match your teaching assignments.</EmptyState> :
      <Table><THead><tr><TH>Exam</TH><TH>Class</TH><TH>Subject</TH><TH>Date</TH><TH>Action</TH></tr></THead><TBody>{mine.map((exam, index) => <tr key={getId(exam) || index}><TD>{exam.name}</TD><TD>{lookup.className(exam.class_id)}{exam.section_id ? ` · ${lookup.sectionName(exam.section_id)}` : " · All sections"}</TD><TD>{lookup.subjectName(exam.subject_id)}</TD><TD>{formatDate(exam.exam_date)}</TD><TD>{getId(exam) && <Button size="sm" asChild><Link href={`/dashboard/exams/schedules/${getId(exam)}/marks`}>Enter marks</Link></Button>}</TD></tr>)}</TBody></Table>}
  </div>;
}
