"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, PageHeader } from "@/components/form";
import { Loading } from "@/components/data-display";
import ExamForm from "@/components/exams/exam-form";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { getExamSchedule, updateExamSchedule } from "@/lib/exams";

export default function EditExamPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { years, loading: yearsLoading } = useAcademicYears();
  const exam = useQuery(`exam:${id}`, () => getExamSchedule(id));

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Edit exam"
        backHref="/dashboard/exams/schedules"
        action={
          <Button variant="outline" asChild>
            <Link href={`/dashboard/exams/schedules/${id}/marks`}>Enter marks</Link>
          </Button>
        }
      />
      {exam.error && <Alert type="error">{exam.error}</Alert>}
      {(exam.loading || yearsLoading) && !exam.error && <Loading />}
      {exam.data && !yearsLoading && (
        <ExamForm
          years={years}
          defaultTarget={{ year: exam.data.academic_year_id, class: exam.data.class_id, section: exam.data.section_id ?? "" }}
          initialData={exam.data}
          submitLabel="Save changes"
          onSubmit={async (r) => {
            // Class, section, subject and type are fixed once scheduled
            await updateExamSchedule(id, {
              name: r.name,
              exam_date: r.exam_date,
              start_time: r.start_time,
              end_time: r.end_time,
              max_marks: r.max_marks,
              passing_marks: r.passing_marks,
              venue: r.venue,
              status: r.status,
            });
            router.push(`/dashboard/exams/schedules?year=${r.academic_year_id}&class=${r.class_id}`);
          }}
        />
      )}
    </div>
  );
}
