"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Alert, Field, PageHeader } from "@/components/form";
import { Card, DetailList, Loading, StatusBadge } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { useQuery } from "@/hooks/use-query";
import { getPaymentSubmission, reviewPaymentSubmission } from "@/lib/fees";
import { formatCurrency, formatDate, formatEnum, getErrorMessage } from "@/lib/utils";

export default function PaymentSubmissionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const submission = useQuery(`payment-submission:${id}`, () => getPaymentSubmission(id));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const item = submission.data;
  const status = item?.status?.toUpperCase() ?? "PENDING";
  const canReview = !["APPROVED", "REJECTED"].includes(status);

  const decide = async (decision: "approve" | "reject") => {
    if (decision === "reject" && !reason.trim()) {
      setError("Enter a reason for rejecting this payment.");
      return;
    }
    if (decision === "approve" && !window.confirm("Approve this payment submission?")) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await reviewPaymentSubmission(id, decision, reason.trim());
      setMessage(decision === "approve" ? "Payment approved." : "Payment rejected.");
      submission.reload();
    } catch (err) {
      setError(getErrorMessage(err, "Could not review payment"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader title="Payment submission" description="Review the payment details and evidence" backHref="/dashboard/fees/payment-submissions" />
      {(submission.error || error) && <Alert type="error">{submission.error || error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}
      {submission.loading && <Loading />}
      {item && (
        <>
          <Card title="Submitted payment" action={<StatusBadge value={status} tones={{ PENDING: "yellow", APPROVED: "green", REJECTED: "red" }} />}>
            <DetailList items={[
              { label: "Amount", value: typeof item.amount_paid === "number" ? formatCurrency(item.amount_paid) : undefined },
              { label: "Payment mode", value: item.payment_mode ? formatEnum(item.payment_mode) : undefined },
              { label: "Payment date", value: formatDate(item.payment_date) },
              { label: "Submitted", value: formatDate(item.created_at) },
              { label: "Reference", value: item.transaction_reference },
              { label: "Student", value: item.student_id && <Link href={`/dashboard/students/${item.student_id}`} className="text-link hover:underline">{item.student_id}</Link> },
              { label: "Invoice", value: item.invoice_id && <Link href={`/dashboard/fees/invoices/${item.invoice_id}`} className="text-link hover:underline">{item.invoice_id}</Link> },
            ]} />
            {item.remarks && <p className="mt-4 text-sm"><span className="font-medium">Remarks:</span> {item.remarks}</p>}
            {item.proof_file_id && (
              <Button variant="outline" size="sm" asChild className="mt-4">
                <a href={`/api/v1/school-backend/files/${encodeURIComponent(item.proof_file_id)}/content`} target="_blank" rel="noopener noreferrer">Open payment proof</a>
              </Button>
            )}
          </Card>
          {canReview && (
            <Card title="Decision">
              <div className="space-y-4">
                <Field label="Reason" htmlFor="review-reason" hint="Required for rejection; optional for approval.">
                  <textarea id="review-reason" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} rows={3} className="w-full rounded-md border border-input bg-transparent p-3 text-sm" />
                </Field>
                <div className="flex flex-wrap gap-2">
                  <Button disabled={busy} onClick={() => decide("approve")}>{busy ? "Saving..." : "Approve payment"}</Button>
                  <Button disabled={busy} variant="outline" onClick={() => decide("reject")}>Reject payment</Button>
                </div>
              </div>
            </Card>
          )}
          {!canReview && (item.reviewer_remarks || item.rejection_reason) && <Card title="Review notes"><p className="text-sm">{item.reviewer_remarks || item.rejection_reason}</p></Card>}
        </>
      )}
    </div>
  );
}
