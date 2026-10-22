"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, PageHeader } from "@/components/form";
import { EmptyState, Loading, StatusBadge, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { useQuery } from "@/hooks/use-query";
import { useStudentNames } from "@/hooks/use-student-names";
import { listPendingPaymentSubmissions } from "@/lib/fees";
import { formatCurrency, formatDate, formatEnum } from "@/lib/utils";

export default function PaymentSubmissionsPage() {
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const after = cursors[cursors.length - 1];
  const pending = useQuery(`payment-submissions:${after ?? "first"}`, () => listPendingPaymentSubmissions(after));
  const students = useStudentNames();
  const rows = pending.data?.items ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title="Payment reviews" description="Check submitted payment evidence before accepting it" />
      {pending.error && <Alert type="error">{pending.error}</Alert>}
      {pending.loading ? (
        <Loading />
      ) : rows.length === 0 && !pending.error ? (
        <EmptyState>No pending payment submissions.</EmptyState>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Student</TH><TH>Invoice</TH><TH>Paid</TH><TH>Mode</TH><TH>Submitted</TH><TH>Status</TH><TH>Action</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((item) => {
              const id = item.id ?? item._id ?? item.submission_id ?? "";
              return (
                <tr key={id || `${item.invoice_id}-${item.student_id}`}>
                  <TD>{item.student_id ? <Link className="text-link hover:underline" href={`/dashboard/students/${item.student_id}`}>{students.name(item.student_id)}</Link> : "—"}</TD>
                  <TD>{item.invoice_id ? <Link className="font-mono text-xs text-link hover:underline" href={`/dashboard/fees/invoices/${item.invoice_id}`}>{item.invoice_id}</Link> : "—"}</TD>
                  <TD className="font-semibold">{typeof item.amount_paid === "number" ? formatCurrency(item.amount_paid) : "—"}</TD>
                  <TD>{item.payment_mode ? formatEnum(item.payment_mode) : "—"}</TD>
                  <TD>{formatDate(item.created_at ?? item.payment_date)}</TD>
                  <TD><StatusBadge value={item.status ?? "PENDING"} tones={{ PENDING: "yellow" }} /></TD>
                  <TD>{id ? <Link className="text-link hover:underline" href={`/dashboard/fees/payment-submissions/${id}`}>Review</Link> : "—"}</TD>
                </tr>
              );
            })}
          </TBody>
        </Table>
      )}
      <div className="flex gap-2">
        {cursors.length > 1 && <Button variant="outline" size="sm" onClick={() => setCursors((old) => old.slice(0, -1))}>Previous</Button>}
        {pending.data?.next && <Button variant="outline" size="sm" onClick={() => setCursors((old) => [...old, pending.data!.next!])}>Next</Button>}
      </div>
    </div>
  );
}
