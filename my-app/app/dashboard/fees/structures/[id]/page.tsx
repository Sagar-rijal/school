"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Alert, PageHeader } from "@/components/form";
import { Loading } from "@/components/data-display";
import StructureForm from "@/components/fees/structure-form";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { getFeeStructure, listFeeCategories, updateFeeStructure } from "@/lib/fees";

export default function EditFeeStructurePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { years, loading: yearsLoading, defaultYearId } = useAcademicYears();
  const categories = useQuery("fee-categories", listFeeCategories);
  const structure = useQuery(`structure:${id}`, () => getFeeStructure(id));
  const error = structure.error || categories.error;

  return (
    <div className="max-w-3xl">
      <PageHeader title="Edit fee structure" backHref="/dashboard/fees/structures" />
      {error && <Alert type="error">{error}</Alert>}
      {(yearsLoading || categories.loading || structure.loading) && !error && <Loading />}
      {structure.data && !yearsLoading && !categories.loading && (
        <StructureForm
          years={years}
          categories={categories.data ?? []}
          defaultYearId={defaultYearId}
          initialData={structure.data}
          submitLabel="Save changes"
          onSubmit={async ({ name, frequency, line_items, due_date, academic_year_id, class_id }) => {
            // Year and class aren't part of FeeStructureUpdate
            await updateFeeStructure(id, { name, frequency, line_items, due_date });
            router.push(`/dashboard/fees/structures?year=${academic_year_id}&class=${class_id}`);
          }}
        />
      )}
    </div>
  );
}
