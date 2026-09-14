"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/form";
import { Card, Loading, NumberStats, StatusBadge } from "@/components/data-display";
import { useQuery } from "@/hooks/use-query";
import { getStudentAttendance, getStudentAttendanceSummary } from "@/lib/attendance";
import { getId } from "@/lib/api";
import { ATTENDANCE_STATUS_TONES } from "@/lib/types/attendance";
import { formatDate, todayInput } from "@/lib/utils";

function daysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Attendance summary and non-present days for a student over a date range. */
export default function AttendanceCard({ studentId }: { studentId: string }) {
  const [from, setFrom] = useState(daysAgo(30));
  const [to, setTo] = useState(todayInput());
  const valid = !!from && !!to && from <= to;

  const key = valid ? `student-attendance:${studentId}:${from}:${to}` : null;
  const summary = useQuery(key, () => getStudentAttendanceSummary(studentId, from, to));
  const records = useQuery(key, () => getStudentAttendance(studentId, from, to));

  const exceptions = (records.data ?? [])
    .filter((r) => r.status !== "PRESENT")
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return (
    <Card
      title="Attendance"
      action={
        <div className="flex items-center gap-1 text-sm">
          <Input type="date" aria-label="From" value={from} max={to} onChange={(e) => setFrom(e.target.value)} className="h-8 w-auto" />
          <span className="text-muted-foreground">to</span>
          <Input type="date" aria-label="To" value={to} min={from} max={todayInput()} onChange={(e) => setTo(e.target.value)} className="h-8 w-auto" />
        </div>
      }
    >
      <div className="space-y-4">
        {(summary.error || records.error) && <Alert type="error">{summary.error || records.error}</Alert>}
        {summary.loading ? <Loading /> : <NumberStats data={summary.data} />}

        {!records.loading && (
          <div>
            <p className="mb-2 text-sm font-medium">
              {exceptions.length === 0 ? "No absences or late arrivals in this range." : "Days not present"}
            </p>
            {exceptions.length > 0 && (
              <ul className="max-h-60 divide-y overflow-y-auto rounded-md border text-sm">
                {exceptions.map((r, i) => (
                  <li key={getId(r) || i} className="flex items-center justify-between gap-2 px-3 py-2">
                    <span>
                      {formatDate(r.date)}
                      {r.period ? ` · Period ${r.period}` : ""}
                      {r.remarks ? <span className="text-muted-foreground"> · {r.remarks}</span> : null}
                    </span>
                    <StatusBadge value={r.status} tones={ATTENDANCE_STATUS_TONES} />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
