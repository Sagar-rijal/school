"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import FamilyPage, { type FamilyContext } from "@/components/family/family-page";
import { Alert, Field, Select } from "@/components/form";
import { Card, EmptyState, Loading, StatusBadge, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { applyForLeave, listLeaveApplications, type LeaveType } from "@/lib/leaves";
import { studentLabel } from "@/lib/students";
import { formatDate, formatEnum, getErrorMessage, todayInput } from "@/lib/utils";

const LEAVE_TYPES: LeaveType[] = ["SICK", "CASUAL", "EMERGENCY", "OTHER"];

function Leave({ child, isParent }: FamilyContext) {
  const requests = useQuery("family-leave", () => listLeaveApplications());
  const [type, setType] = useState<LeaveType>("SICK");
  const [start, setStart] = useState(todayInput());
  const [end, setEnd] = useState(todayInput());
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Show this child's requests (a parent's list may include siblings)
  const rows = (requests.data ?? [])
    .filter((r) => !r.student_id || r.student_id === child.studentId)
    .sort((a, b) => (b.start_date ?? "").localeCompare(a.start_date ?? ""));

  const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setMessage("");
    if (end < start) { setError("End date must be on or after the start date."); return; }
    setBusy(true);
    try {
      await applyForLeave({
        leave_type: type, reason: reason.trim(), student_id: child.studentId,
        start_date: new Date(`${start}T00:00:00`).toISOString(), end_date: new Date(`${end}T23:59:59`).toISOString(),
      });
      setReason(""); setMessage("Leave request sent to the class teacher."); requests.reload();
    } catch (err) { setError(getErrorMessage(err, "Could not send leave request")); }
    finally { setBusy(false); }
  };

  return (
    <>
      {(error || requests.error) && <Alert type="error">{error || requests.error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}
      <Card title={isParent ? `Request leave for ${studentLabel(child.student)}` : "Request leave"}>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Type" htmlFor="leave-type">
              <Select id="leave-type" value={type} onChange={(e) => setType(e.target.value as LeaveType)}>
                {LEAVE_TYPES.map((t) => <option key={t} value={t}>{formatEnum(t)}</option>)}
              </Select>
            </Field>
            <Field label="From" htmlFor="leave-start" required><Input id="leave-start" type="date" required value={start} onChange={(e) => setStart(e.target.value)} /></Field>
            <Field label="To" htmlFor="leave-end" required><Input id="leave-end" type="date" required min={start} value={end} onChange={(e) => setEnd(e.target.value)} /></Field>
          </div>
          <Field label="Reason" htmlFor="leave-reason" required>
            <textarea id="leave-reason" required maxLength={1000} rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-md border border-input bg-transparent p-3 text-sm" />
          </Field>
          <Button type="submit" disabled={busy}>{busy ? "Sending..." : "Send request"}</Button>
        </form>
      </Card>
      <Card title="Requests">
        {requests.loading ? <Loading /> : rows.length === 0 ? <EmptyState>No leave requests yet.</EmptyState> : (
          <Table>
            <THead><tr><TH>Dates</TH><TH>Type</TH><TH>Reason</TH><TH>Status</TH></tr></THead>
            <TBody>
              {rows.map((r, i) => (
                <tr key={getId(r) || i}>
                  <TD>{formatDate(r.start_date)} – {formatDate(r.end_date)}</TD>
                  <TD>{r.leave_type ? formatEnum(r.leave_type) : "—"}</TD>
                  <TD>{r.reason}{r.reviewer_remarks && <p className="text-xs text-muted-foreground">School: {r.reviewer_remarks}</p>}</TD>
                  <TD><StatusBadge value={r.status ?? "PENDING"} tones={{ PENDING: "yellow", APPROVED: "green", REJECTED: "red" }} /></TD>
                </tr>
              ))}
            </TBody>
          </Table>
        )}
      </Card>
    </>
  );
}

export default function FamilyLeavePage() {
  return <FamilyPage title="Leave" description="Tell the school about an absence">{(ctx) => <Leave {...ctx} />}</FamilyPage>;
}
