"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Alert, PageHeader } from "@/components/form";
import ClassForm from "@/components/classes/class-form";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { createClass } from "@/lib/academic";

export default function NewClassPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { year } = use(searchParams);
  const router = useRouter();
  const { years, loading, error, defaultYearId } = useAcademicYears();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add class" backHref={`/dashboard/classes${year ? `?year=${year}` : ""}`} />
      {error && <Alert type="error">{error}</Alert>}
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <ClassForm
          years={years}
          defaultYearId={year || defaultYearId}
          submitLabel="Create class"
          onSubmit={createClass}
          onSuccess={(payload) => router.push(`/dashboard/classes?year=${payload.academic_year_id}`)}
        />
      )}
    </div>
  );
}
