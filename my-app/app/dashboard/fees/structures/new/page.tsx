"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Alert, PageHeader } from "@/components/form";
import { Loading } from "@/components/data-display";
import StructureForm from "@/components/fees/structure-form";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { createFeeStructure, listFeeCategories } from "@/lib/fees";

export default function NewFeeStructurePage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const { year } = use(searchParams);
  const router = useRouter();
  const { years, loading: yearsLoading, defaultYearId } = useAcademicYears();
  const categories = useQuery("fee-categories", listFeeCategories);

  return (
    <div className="max-w-3xl">
      <PageHeader title="New fee structure" backHref="/dashboard/fees/structures" />
      {categories.error && <Alert type="error">{categories.error}</Alert>}
      {yearsLoading || categories.loading ? (
        <Loading />
      ) : (
        <StructureForm
          years={years}
          categories={categories.data ?? []}
          defaultYearId={year || defaultYearId}
          submitLabel="Create fee structure"
          onSubmit={async (payload) => {
            await createFeeStructure(payload);
            router.push(`/dashboard/fees/structures?year=${payload.academic_year_id}&class=${payload.class_id}`);
          }}
        />
      )}
    </div>
  );
}
