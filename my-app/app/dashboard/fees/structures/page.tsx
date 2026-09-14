"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, PageHeader } from "@/components/form";
import { EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import ClassSectionPicker from "@/components/class-section-picker";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { getId } from "@/lib/api";
import { deleteFeeStructure, listFeeStructures, structureTotal } from "@/lib/fees";
import type { FeeStructure } from "@/lib/types/fees";
import { formatCurrency, formatDate, formatEnum, getErrorMessage } from "@/lib/utils";

type Filters = { year?: string; class?: string };

export default function FeeStructuresPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = use(searchParams);
  const setFilters = useUrlFilters("/dashboard/fees/structures", filters);
  const { years, defaultYearId } = useAcademicYears();
  const lookup = useAcademicLookup();
  const year = filters.year || defaultYearId;

  const structures = useQuery(year ? `structures:${year}:${filters.class}` : null, () =>
    listFeeStructures({ academic_year_id: year, class_id: filters.class })
  );
  const [error, setError] = useState("");

  const handleDelete = async (s: FeeStructure) => {
    if (!window.confirm(`Delete "${s.name}"? Existing invoices are not affected.`)) return;
    setError("");
    try {
      await deleteFeeStructure(getId(s));
      structures.setData((prev) => prev?.filter((x) => getId(x) !== getId(s)));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete fee structure"));
    }
  };

  const rows = [...(structures.data ?? [])].sort((a, b) => lookup.className(a.class_id).localeCompare(lookup.className(b.class_id), undefined, { numeric: true }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Fee structures"
        description="What each class pays in an academic year"
        action={
          <Button asChild>
            <Link href={`/dashboard/fees/structures/new${year ? `?year=${year}` : ""}`}>+ New structure</Link>
          </Button>
        }
      />

      <ClassSectionPicker
        years={years}
        value={{ year, class: filters.class ?? "", section: "" }}
        onChange={(v) => setFilters({ year: v.year, class: v.class })}
        classPlaceholder="All classes"
        hideSection
      />

      {(error || structures.error) && <Alert type="error">{error || structures.error}</Alert>}

      {structures.loading || lookup.loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState>No fee structures for this selection.</EmptyState>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Class</TH>
              <TH>Frequency</TH>
              <TH>Items</TH>
              <TH>Due date</TH>
              <TH className="text-right">Total</TH>
              <TH />
            </tr>
          </THead>
          <TBody>
            {rows.map((s) => (
              <tr key={getId(s)} className="hover:bg-muted/30">
                <TD className="font-medium">{s.name}</TD>
                <TD>{lookup.className(s.class_id)}</TD>
                <TD>{formatEnum(s.frequency)}</TD>
                <TD className="max-w-64 truncate text-muted-foreground">{s.line_items?.map((li) => li.category_name).join(", ")}</TD>
                <TD>{formatDate(s.due_date)}</TD>
                <TD className="text-right font-semibold">{formatCurrency(structureTotal(s))}</TD>
                <TD className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/fees/structures/${getId(s)}`}>Edit</Link>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(s)} className="text-red-600 hover:text-red-700">
                      Delete
                    </Button>
                  </div>
                </TD>
              </tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
