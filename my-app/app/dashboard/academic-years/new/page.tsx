"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/form";
import AcademicYearForm from "@/components/academic-years/academic-year-form";
import { createAcademicYear } from "@/lib/academic";

export default function NewAcademicYearPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Add academic year" backHref="/dashboard/academic-years" />
      <AcademicYearForm
        submitLabel="Create academic year"
        onSubmit={createAcademicYear}
        onSuccess={() => router.push("/dashboard/academic-years")}
      />
    </div>
  );
}
