"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, PageHeader, Select } from "@/components/form";
import { EmptyState, Loading, StatusBadge, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { useQuery } from "@/hooks/use-query";
import { listLeaveApplications, type LeaveStatus } from "@/lib/leaves";
import { formatDate, formatEnum } from "@/lib/utils";

const TONES = { PENDING: "yellow", APPROVED: "green", REJECTED: "red" } as const;

export default function LeaveRequestsPage() {
  const [status, setStatus] = useState<LeaveStatus | "">("PENDING");
  const leaves = useQuery(`leaves:${status || "all"}`, () => listLeaveApplications(status || undefined));
  const rows = leaves.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader title="Leave requests" description="Review leave applications from your school" />
      <Select aria-label="Filter leave status" className="w-auto min-w-40" value={status} onChange={(e) => setStatus(e.target.value as LeaveStatus | "")}>
        <option value="">All statuses</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="REJECTED">Rejected</option>
      </Select>
      {leaves.error && <Alert type="error">{leaves.error}</Alert>}
      {leaves.loading ? <Loading /> : rows.length === 0 && !leaves.error ? <EmptyState>No leave requests found.</EmptyState> : (
        <Table>
          <THead><tr><TH>Student</TH><TH>Type</TH><TH>Dates</TH><TH>Reason</TH><TH>Status</TH><TH>Action</TH></tr></THead>
          <TBody>
            {rows.map((item) => {
              const id = item.id ?? item._id ?? item.application_id ?? "";
              return (
                <tr key={id || `${item.student_id}-${item.start_date}`}>
                  <TD>{item.student_id ? <Link href={`/dashboard/students/${item.student_id}`} className="text-link hover:underline">{item.student_id}</Link> : "—"}</TD>
                  <TD>{item.leave_type ? formatEnum(item.leave_type) : "—"}</TD>
                  <TD>{formatDate(item.start_date)} – {formatDate(item.end_date)}</TD>
                  <TD className="max-w-56 truncate"><span title={item.reason}>{item.reason || "—"}</span></TD>
                  <TD><StatusBadge value={item.status ?? "PENDING"} tones={TONES} /></TD>
                  <TD>{id ? <Link href={`/dashboard/leaves/${id}`} className="text-link hover:underline">View</Link> : "—"}</TD>
                </tr>
              );
            })}
          </TBody>
        </Table>
      )}
    </div>
  );
}
