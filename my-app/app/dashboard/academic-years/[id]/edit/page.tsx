"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, PageHeader } from "@/components/form";
import AcademicYearForm from "@/components/academic-years/academic-year-form";
import { getAcademicYear, updateAcademicYear } from "@/lib/academic";
import type { AcademicYear } from "@/lib/types/academic";
import { getErrorMessage } from "@/lib/utils";

export default function EditAcademicYearPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [year, setYear] = useState<AcademicYear | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAcademicYear(id)
      .then(setYear)
      .catch((err) => setError(getErrorMessage(err, "Failed to load academic year")));
  }, [id]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit academic year" backHref="/dashboard/academic-years" />
      {error && <Alert type="error">{error}</Alert>}
      {!year && !error && <p className="text-muted-foreground">Loading...</p>}
      {year && (
        <AcademicYearForm
          initialData={year}
          submitLabel="Save changes"
          onSubmit={(payload) => updateAcademicYear(id, payload)}
          onSuccess={() => router.push("/dashboard/academic-years")}
        />
      )}
    </div>
  );
}
