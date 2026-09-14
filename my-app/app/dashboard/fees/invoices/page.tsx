"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, PageHeader, Select } from "@/components/form";
import { EmptyState, Loading, StatTile, StatusBadge, Table, TBody, TD, TH, THead } from "@/components/data-display";
import AcademicYearSelect from "@/components/academic-years/academic-year-select";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { useStudentNames } from "@/hooks/use-student-names";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { getId } from "@/lib/api";
import { invoiceAmounts, listFeeStructures, listInvoices } from "@/lib/fees";
import { INVOICE_STATUS_TONES, INVOICE_STATUSES } from "@/lib/types/fees";
import { formatCurrency, formatDate, formatEnum } from "@/lib/utils";

type Filters = { year?: string; status?: string };

export default function InvoicesPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = use(searchParams);
  const setFilters = useUrlFilters("/dashboard/fees/invoices", filters);
  const { years, defaultYearId } = useAcademicYears();
  const students = useStudentNames();
  const [search, setSearch] = useState("");
  const year = filters.year || defaultYearId;

  const invoices = useQuery(year ? `invoices:${year}:${filters.status}` : null, () =>
    listInvoices({ academic_year_id: year, status: filters.status })
  );
  const structures = useQuery(year ? `structures:${year}:` : null, () => listFeeStructures({ academic_year_id: year }));

  const structureById = new Map((structures.data ?? []).map((s) => [getId(s), s]));
  const query = search.trim().toLowerCase();

  const rows = (invoices.data ?? [])
    .map((inv) => ({ inv, amounts: invoiceAmounts(inv, structureById.get(inv.fee_structure_id)) }))
    .filter(
      ({ inv }) =>
        !query ||
        inv.invoice_number?.toLowerCase().includes(query) ||
        students.name(inv.student_id).toLowerCase().includes(query) ||
        students.student(inv.student_id)?.admission_number?.toLowerCase().includes(query)
    )
    .sort((a, b) => (b.inv.invoice_number ?? "").localeCompare(a.inv.invoice_number ?? ""));

  const totals = rows.reduce(
    (acc, { amounts }) => ({ billed: acc.billed + amounts.total - amounts.discount + amounts.fine, paid: acc.paid + amounts.paid, due: acc.due + amounts.balance }),
    { billed: 0, paid: 0, due: 0 }
  );

  return (
    <div className="space-y-4">
      <PageHeader
        title="Invoices"
        description="Fee invoices and their payment status"
        action={
          <Button asChild>
            <Link href="/dashboard/fees/invoices/new">+ Generate invoices</Link>
          </Button>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <AcademicYearSelect years={years} value={year} onChange={(y) => setFilters({ year: y })} className="w-auto min-w-36" />
        <Select aria-label="Status" value={filters.status ?? ""} onChange={(e) => setFilters({ status: e.target.value })} className="w-auto min-w-40">
          <option value="">All statuses</option>
          {INVOICE_STATUSES.map((s) => <option key={s} value={s}>{formatEnum(s)}</option>)}
        </Select>
        <Input type="search" aria-label="Search invoices" placeholder="Invoice no., student or admission no." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full sm:w-72" />
      </div>

      {invoices.error && <Alert type="error">{invoices.error}</Alert>}

      {invoices.loading || students.loading ? (
        <Loading>Loading invoices...</Loading>
      ) : rows.length === 0 ? (
        <EmptyState>No invoices for this selection.</EmptyState>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <StatTile label="Billed" value={formatCurrency(totals.billed)} />
            <StatTile label="Collected" value={formatCurrency(totals.paid)} tone="green" />
            <StatTile label="Outstanding" value={formatCurrency(totals.due)} tone={totals.due > 0 ? "red" : undefined} />
          </div>
          <Table>
            <THead>
              <tr>
                <TH>Invoice</TH>
                <TH>Student</TH>
                <TH>Fee structure</TH>
                <TH>Due</TH>
                <TH className="text-right">Amount</TH>
                <TH className="text-right">Paid</TH>
                <TH className="text-right">Balance</TH>
                <TH>Status</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map(({ inv, amounts }) => (
                <tr key={getId(inv)} className="hover:bg-muted/30">
                  <TD>
                    <Link href={`/dashboard/fees/invoices/${getId(inv)}`} className="font-mono text-xs font-medium hover:underline">
                      {inv.invoice_number}
                    </Link>
                  </TD>
                  <TD>
                    <Link href={`/dashboard/students/${inv.student_id}`} className="hover:underline">{students.name(inv.student_id)}</Link>
                  </TD>
                  <TD className="text-muted-foreground">{structureById.get(inv.fee_structure_id)?.name ?? "—"}</TD>
                  <TD>{formatDate(inv.due_date)}</TD>
                  <TD className="text-right">{formatCurrency(amounts.total - amounts.discount + amounts.fine)}</TD>
                  <TD className="text-right">{formatCurrency(amounts.paid)}</TD>
                  <TD className="text-right font-semibold">{formatCurrency(amounts.balance)}</TD>
                  <TD><StatusBadge value={inv.status ?? "PENDING"} tones={INVOICE_STATUS_TONES} /></TD>
                </tr>
              ))}
            </TBody>
          </Table>
        </>
      )}
    </div>
  );
}
