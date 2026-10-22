"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Alert, Field, PageHeader } from "@/components/form";
import { Card, DetailList, Loading, StatusBadge } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { useQuery } from "@/hooks/use-query";
import { getLeaveApplication, reviewLeaveApplication } from "@/lib/leaves";
import { formatDate, formatEnum, getErrorMessage } from "@/lib/utils";

export default function LeaveRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const leave = useQuery(`leave:${id}`, () => getLeaveApplication(id));
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const item = leave.data;
  const status = item?.status ?? "PENDING";

  const decide = async (nextStatus: "APPROVED" | "REJECTED") => {
    if (nextStatus === "REJECTED" && !remarks.trim()) {
      setError("Enter a reason for rejecting this leave request.");
      return;
    }
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await reviewLeaveApplication(id, nextStatus, remarks.trim());
      setMessage(nextStatus === "APPROVED" ? "Leave approved." : "Leave rejected.");
      leave.reload();
    } catch (err) {
      setError(getErrorMessage(err, "Could not update leave request"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader title="Leave request" backHref="/dashboard/leaves" />
      {(leave.error || error) && <Alert type="error">{leave.error || error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}
      {leave.loading && <Loading />}
      {item && (
        <>
          <Card title="Application" action={<StatusBadge value={status} tones={{ PENDING: "yellow", APPROVED: "green", REJECTED: "red" }} />}>
            <DetailList items={[
              { label: "Student", value: item.student_id && <Link href={`/dashboard/students/${item.student_id}`} className="text-link hover:underline">{item.student_id}</Link> },
              { label: "Type", value: item.leave_type ? formatEnum(item.leave_type) : undefined },
              { label: "Starts", value: formatDate(item.start_date) },
              { label: "Ends", value: formatDate(item.end_date) },
              { label: "Submitted", value: formatDate(item.created_at) },
            ]} />
            {item.reason && <p className="mt-4 text-sm"><span className="font-medium">Reason:</span> {item.reason}</p>}
            {item.reviewer_remarks && <p className="mt-3 text-sm"><span className="font-medium">Review notes:</span> {item.reviewer_remarks}</p>}
          </Card>
          {status === "PENDING" && (
            <Card title="Decision">
              <div className="space-y-4">
                <Field label="Review notes" htmlFor="leave-review-notes" hint="Required when rejecting a request.">
                  <textarea id="leave-review-notes" rows={3} value={remarks} onChange={(e) => setRemarks(e.target.value)} className="w-full rounded-md border border-input bg-transparent p-3 text-sm" />
                </Field>
                <div className="flex gap-2">
                  <Button disabled={busy} onClick={() => decide("APPROVED")}>{busy ? "Saving..." : "Approve"}</Button>
                  <Button disabled={busy} variant="outline" onClick={() => decide("REJECTED")}>Reject</Button>
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
