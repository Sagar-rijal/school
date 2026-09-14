"use client";

import { useRouter } from "next/navigation";
import { Alert, PageHeader } from "@/components/form";
import SubjectForm from "@/components/subjects/subject-form";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useClasses } from "@/hooks/use-classes";
import { createSubject } from "@/lib/academic";

export default function NewSubjectPage() {
  const router = useRouter();
  const { years, loading: yearsLoading, error: yearsError, defaultYearId } = useAcademicYears();
  const { classes, loading: classesLoading, error: classesError } = useClasses();
  const error = yearsError || classesError;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Add subject" backHref="/dashboard/subjects" />
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
      {yearsLoading || classesLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <SubjectForm
          years={years}
          classes={classes}
          defaultYearId={defaultYearId}
          submitLabel="Create subject"
          onSubmit={createSubject}
          onSuccess={() => router.push("/dashboard/subjects")}
        />
      )}
    </div>
  );
}
