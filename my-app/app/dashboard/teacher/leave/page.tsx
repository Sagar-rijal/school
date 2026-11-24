"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { PageHeader, Alert, Field, Select } from "@/components/form";
import { Card } from "@/components/data-display";
import { EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { applyForLeave, listLeaveApplications, type LeaveType } from "@/lib/leaves";
import { useSession } from "@/components/session-provider";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { hasPermission } from "@/lib/access";
import { getErrorMessage } from "@/lib/utils";

export default function TeacherLeavePage() {
  const session = useSession();
  const canRead = !!session && hasPermission(session, "leave:read");
  const canApply = !!session && hasPermission(session, "leave:apply");
  const requests = useQuery(canRead ? `my-leave:${session!.id}` : null, listLeaveApplications);
  const [type, setType] = useState<LeaveType>("CASUAL");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setMessage("");
    if (end < start) { setError("End date must be on or after the start date."); return; }
    setBusy(true);
    try {
      await applyForLeave({ leave_type: type, reason: reason.trim(), start_date: new Date(`${start}T00:00:00`).toISOString(), end_date: new Date(`${end}T23:59:59`).toISOString() });
      setStart(""); setEnd(""); setReason(""); setMessage("Leave request submitted to the school."); requests.reload();
    } catch (err) { setError(getErrorMessage(err, "Could not submit leave request")); }
    finally { setBusy(false); }
  };
  return <div className="mx-auto max-w-xl space-y-5"><PageHeader title="My leave" description="Send a leave request to the principal" backHref="/dashboard/teacher" />
    {(error || requests.error) && <Alert type="error">{error || requests.error}</Alert>}{message && <Alert type="success">{message}</Alert>}
    {canApply && <Card title="New leave request"><form onSubmit={submit} className="space-y-4"><Field label="Leave type" htmlFor="leave-type"><Select id="leave-type" value={type} onChange={(e) => setType(e.target.value as LeaveType)}>{(["CASUAL", "SICK", "EMERGENCY", "OTHER"] as const).map((item) => <option key={item} value={item}>{item.charAt(0) + item.slice(1).toLowerCase()}</option>)}</Select></Field>
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Start date" htmlFor="leave-start" required><Input id="leave-start" type="date" required value={start} onChange={(e) => setStart(e.target.value)} /></Field><Field label="End date" htmlFor="leave-end" required><Input id="leave-end" type="date" required min={start} value={end} onChange={(e) => setEnd(e.target.value)} /></Field></div>
      <Field label="Reason" htmlFor="leave-reason" required><textarea id="leave-reason" required maxLength={1000} rows={4} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-md border border-input bg-transparent p-3 text-sm" /></Field>
      <Button type="submit" disabled={busy}>{busy ? "Submitting..." : "Submit request"}</Button></form></Card>}
    {canRead && <Card title="My requests">{requests.loading ? <Loading /> : (() => {
      const mine = (requests.data ?? []).filter((item) => item.applicant_id === session?.id);
      return mine.length === 0 ? <EmptyState>No leave requests found for your account.</EmptyState> : <Table><THead><tr><TH>Dates</TH><TH>Type</TH><TH>Reason</TH><TH>Status</TH></tr></THead><TBody>{mine.map((item, index) => <tr key={getId(item) || index}><TD>{item.start_date?.slice(0, 10)} to {item.end_date?.slice(0, 10)}</TD><TD>{item.leave_type ?? "—"}</TD><TD>{item.reason ?? "—"}</TD><TD>{item.status ?? "PENDING"}</TD></tr>)}</TBody></Table>;
    })()}</Card>}
  </div>;
}
