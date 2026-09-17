"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/form";
import { Card, EmptyState, Loading, NumberStats, StatusBadge } from "@/components/data-display";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { getStudentFeeSummary, invoiceAmounts, listPaymentsByStudent, listStudentInvoices } from "@/lib/fees";
import { INVOICE_STATUS_TONES } from "@/lib/types/fees";
import { formatCurrency, formatDate, formatEnum } from "@/lib/utils";

/** Fee summary and invoices for a student. */
export default function FeesCard({ studentId }: { studentId: string }) {
  const summary = useQuery(`fee-summary:${studentId}`, () => getStudentFeeSummary(studentId));
  const invoices = useQuery(`student-invoices:${studentId}`, () => listStudentInvoices(studentId));
  const payments = useQuery(`student-payments:${studentId}`, () => listPaymentsByStudent(studentId));
  const recentPayments = [...(payments.data ?? [])].sort((a, b) => b.payment_date.localeCompare(a.payment_date)).slice(0, 5);

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
        {(summary.error || invoices.error || payments.error) && (
          <Alert type="error">{summary.error || invoices.error || payments.error}</Alert>
        )}
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

        {recentPayments.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Recent receipts</p>
            <ul className="divide-y rounded-md border text-sm">
              {recentPayments.map((p) => (
                <li key={getId(p) || p.receipt_number} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span>
                    <span className="font-mono text-xs">{p.receipt_number}</span>
                    <span className="text-muted-foreground"> · {formatDate(p.payment_date)} · {formatEnum(p.payment_mode)}</span>
                  </span>
                  <span className="font-semibold">{formatCurrency(p.amount_paid)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Card>
  );
}
