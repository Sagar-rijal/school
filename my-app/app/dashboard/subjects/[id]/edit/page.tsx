"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, PageHeader } from "@/components/form";
import SubjectForm from "@/components/subjects/subject-form";
import SubjectTeachers from "@/components/subjects/subject-teachers";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useClasses } from "@/hooks/use-classes";
import { getSubject, updateSubject } from "@/lib/academic";
import type { Subject } from "@/lib/types/academic";
import { getErrorMessage } from "@/lib/utils";

export default function EditSubjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { years, loading: yearsLoading, defaultYearId } = useAcademicYears();
  const { classes, loading: classesLoading } = useClasses();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSubject(id)
      .then(setSubject)
      .catch((err) => setError(getErrorMessage(err, "Failed to load subject")));
  }, [id]);

  const ready = subject && !yearsLoading && !classesLoading;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Edit subject" backHref="/dashboard/subjects" />
      {error && <Alert type="error">{error}</Alert>}
      {!ready && !error && <p className="text-muted-foreground">Loading...</p>}
      {ready && (
        <SubjectForm
          years={years}
          classes={classes}
          defaultYearId={defaultYearId}
          initialData={subject}
          submitLabel="Save changes"
          onSubmit={(payload) => updateSubject(id, payload)}
          onSuccess={() => router.push("/dashboard/subjects")}
        />
      )}
      {ready && <SubjectTeachers subjectId={id} />}
    </div>
  );
}
