"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/form";
import { Loading } from "@/components/data-display";
import ExamForm from "@/components/exams/exam-form";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { createExamSchedule } from "@/lib/exams";
import { omit } from "@/lib/utils";

export default function NewExamPage({ searchParams }: { searchParams: Promise<{ year?: string; class?: string }> }) {
  const params = use(searchParams);
  const router = useRouter();
  const { years, loading, defaultYearId } = useAcademicYears();

  return (
    <div className="max-w-3xl">
      <PageHeader title="Schedule exam" backHref="/dashboard/exams/schedules" />
      {loading ? (
        <Loading />
      ) : (
        <ExamForm
          years={years}
          defaultTarget={{ year: params.year || defaultYearId, class: params.class ?? "", section: "" }}
          submitLabel="Schedule exam"
          onSubmit={async (result) => {
            // New exams start as scheduled; status isn't part of ExamScheduleCreate
            await createExamSchedule(omit(result, "status"));
            router.push(`/dashboard/exams/schedules?year=${result.academic_year_id}&class=${result.class_id}`);
          }}
        />
      )}
    </div>
  );
}
