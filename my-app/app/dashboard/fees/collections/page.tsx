"use client";

import { use } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Alert, PageHeader } from "@/components/form";
import { EmptyState, Loading, StatTile, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { useQuery } from "@/hooks/use-query";
import { useStudentNames } from "@/hooks/use-student-names";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { getId } from "@/lib/api";
import { listPaymentsInRange } from "@/lib/fees";
import { formatCurrency, formatDate, formatEnum, todayInput } from "@/lib/utils";

type Filters = { from?: string; to?: string };

export default function CollectionsPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = use(searchParams);
  const setFilters = useUrlFilters("/dashboard/fees/collections", filters);
  const students = useStudentNames();

  const from = filters.from || todayInput();
  const to = filters.to || todayInput();
  const valid = from <= to;

  const payments = useQuery(valid ? `collections:${from}:${to}` : null, () => listPaymentsInRange(from, to));
  const rows = [...(payments.data ?? [])].sort((a, b) => b.payment_date.localeCompare(a.payment_date));

  const total = rows.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
  const byMode = Object.entries(
    rows.reduce<Record<string, number>>((acc, p) => ({ ...acc, [p.payment_mode]: (acc[p.payment_mode] ?? 0) + (p.amount_paid || 0) }), {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-4">
      <PageHeader title="Collections" description="Fee payments received in a date range" />

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Input type="date" aria-label="From" value={from} max={to} onChange={(e) => setFilters({ from: e.target.value })} className="w-auto" />
        <span className="text-muted-foreground">to</span>
        <Input type="date" aria-label="To" value={to} min={from} max={todayInput()} onChange={(e) => setFilters({ to: e.target.value })} className="w-auto" />
      </div>

      {!valid && <Alert type="error">The start date must be before the end date.</Alert>}
      {payments.error && <Alert type="error">{payments.error}</Alert>}

      {payments.loading || students.loading ? (
        <Loading />
      ) : valid && rows.length === 0 ? (
        <EmptyState>No payments in this period.</EmptyState>
      ) : (
        rows.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <StatTile label={`Total (${rows.length} payments)`} value={formatCurrency(total)} tone="green" />
              {byMode.map(([mode, amount]) => (
                <StatTile key={mode} label={formatEnum(mode)} value={formatCurrency(amount)} />
              ))}
            </div>
            <Table>
              <THead>
                <tr>
                  <TH>Date</TH>
                  <TH>Receipt</TH>
                  <TH>Student</TH>
                  <TH>Mode</TH>
                  <TH>Reference</TH>
                  <TH className="text-right">Amount</TH>
                </tr>
              </THead>
              <TBody>
                {rows.map((p) => (
                  <tr key={getId(p) || p.receipt_number} className="hover:bg-muted/30">
                    <TD>{formatDate(p.payment_date)}</TD>
                    <TD>
                      <Link href={`/dashboard/fees/invoices/${p.invoice_id}`} className="font-mono text-xs hover:underline">{p.receipt_number}</Link>
                    </TD>
                    <TD>{students.name(p.student_id)}</TD>
                    <TD>{formatEnum(p.payment_mode)}</TD>
                    <TD>{p.transaction_reference || "—"}</TD>
                    <TD className="text-right font-semibold">{formatCurrency(p.amount_paid)}</TD>
                  </tr>
                ))}
              </TBody>
            </Table>
          </>
        )
      )}
    </div>
  );
}
