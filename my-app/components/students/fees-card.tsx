"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/form";
import { Card, EmptyState, Loading, NumberStats, StatusBadge } from "@/components/data-display";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { getStudentFeeSummary, invoiceAmounts, listStudentInvoices } from "@/lib/fees";
import { INVOICE_STATUS_TONES } from "@/lib/types/fees";
import { formatCurrency, formatDate } from "@/lib/utils";

/** Fee summary and invoices for a student. */
export default function FeesCard({ studentId }: { studentId: string }) {
  const summary = useQuery(`fee-summary:${studentId}`, () => getStudentFeeSummary(studentId));
  const invoices = useQuery(`student-invoices:${studentId}`, () => listStudentInvoices(studentId));

  return (
    <Card
      title="Fees"
      action={
        <Button size="sm" variant="outline" asChild>
          <Link href={`/dashboard/fees/invoices/new?student=${studentId}`}>+ Invoice</Link>
        </Button>
      }
    >
      <div className="space-y-4">
        {(summary.error || invoices.error) && <Alert type="error">{summary.error || invoices.error}</Alert>}
        {summary.loading ? (
          <Loading />
        ) : (
          // Counts (e.g. pending_invoices) stay numbers; everything else is money
          <NumberStats data={summary.data} format={(key, value) => (/count|invoices|number/i.test(key) ? value : formatCurrency(value))} />
        )}

        {invoices.loading ? null : (invoices.data ?? []).length === 0 ? (
          <EmptyState>No invoices yet.</EmptyState>
        ) : (
          <ul className="divide-y rounded-md border text-sm">
            {[...invoices.data!].sort((a, b) => (b.due_date ?? "").localeCompare(a.due_date ?? "")).map((inv) => (
              <li key={getId(inv)} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <div>
                  <Link href={`/dashboard/fees/invoices/${getId(inv)}`} className="font-mono text-xs font-medium hover:underline">{inv.invoice_number}</Link>
                  <p className="text-xs text-muted-foreground">Due {formatDate(inv.due_date)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{formatCurrency(invoiceAmounts(inv).balance)} due</span>
                  <StatusBadge value={inv.status ?? "PENDING"} tones={INVOICE_STATUS_TONES} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
