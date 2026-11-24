"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/form";
import { Card, EmptyState, Loading, NumberStats, StatusBadge } from "@/components/data-display";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { getStudentFeeSummary, invoiceAmounts, listPaymentsByStudent, listStudentInvoices, listStudentPaymentSubmissions } from "@/lib/fees";
import { INVOICE_STATUS_TONES } from "@/lib/types/fees";
import { fileContentUrl } from "@/lib/files";
import { formatCurrency, formatDate, formatEnum } from "@/lib/utils";

/** Fee summary and invoices for a student. */
export default function FeesCard({ studentId }: { studentId: string }) {
  const summary = useQuery(`fee-summary:${studentId}`, () => getStudentFeeSummary(studentId));
  const invoices = useQuery(`student-invoices:${studentId}`, () => listStudentInvoices(studentId));
  const payments = useQuery(`student-payments:${studentId}`, () => listPaymentsByStudent(studentId));
  const submissions = useQuery(`student-payment-submissions:${studentId}`, () => listStudentPaymentSubmissions(studentId));
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
                  <Link href={`/dashboard/fees/invoices/${getId(inv)}`} className="font-mono text-xs font-medium text-link hover:underline">{inv.invoice_number}</Link>
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

        {(submissions.data?.items.length ?? 0) > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">Payment proofs from family</p>
            <ul className="divide-y rounded-md border text-sm">
              {submissions.data!.items.map((s, i) => (
                <li key={getId(s) || s.submission_id || i} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                  <span>
                    <Link href={`/dashboard/fees/payment-submissions/${getId(s) || s.submission_id}`} className="text-link hover:underline">{formatCurrency(s.amount_paid)}</Link>
                    <span className="text-muted-foreground"> · {formatDate(s.payment_date ?? s.created_at)}</span>
                    {s.proof_file_id && <> · <a href={fileContentUrl(s.proof_file_id)} target="_blank" rel="noopener noreferrer" className="text-link hover:underline">Proof</a></>}
                  </span>
                  <StatusBadge value={s.status ?? "PENDING"} tones={{ PENDING: "yellow", APPROVED: "green", REJECTED: "red" }} />
                </li>
              ))}
            </ul>
          </div>
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
