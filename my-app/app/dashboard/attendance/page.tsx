"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, PageHeader, Select } from "@/components/form";
import { EmptyState, Loading, StatTile, Table, TBody, TD, TH, THead } from "@/components/data-display";
import ClassSectionPicker from "@/components/class-section-picker";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { getClassAttendance, getClassAttendanceSummary, markAttendanceBulk } from "@/lib/attendance";
import { listPeriods } from "@/lib/timetable";
import { getRoster, studentLabel } from "@/lib/students";
import {
  ATTENDANCE_STATUSES,
  type AttendanceRecord,
  type AttendanceStatus,
  type AttendanceType,
} from "@/lib/types/attendance";
import { cn, emptyToNull, formatDate, formatEnum, fromDateInput, getErrorMessage, todayInput } from "@/lib/utils";

type Filters = { year?: string; class?: string; section?: string; date?: string; type?: string; period?: string };
type Mark = { status: AttendanceStatus | null; remarks: string };

const STATUS_STYLES: Record<AttendanceStatus, { short: string; active: string }> = {
  PRESENT: { short: "P", active: "bg-green-600 text-white border-green-600" },
  ABSENT: { short: "A", active: "bg-red-600 text-white border-red-600" },
  LATE: { short: "L", active: "bg-amber-500 text-white border-amber-500" },
  EXCUSED: { short: "E", active: "bg-blue-600 text-white border-blue-600" },
  HOLIDAY: { short: "H", active: "bg-gray-500 text-white border-gray-500" },
};

export default function AttendancePage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = use(searchParams);
  const setFilters = useUrlFilters("/dashboard/attendance", filters);
  const { years, defaultYearId } = useAcademicYears();

  const year = filters.year || defaultYearId;
  const date = filters.date || todayInput();
  const type: AttendanceType = filters.type === "PERIOD" ? "PERIOD" : "DAILY";
  const period = type === "PERIOD" && filters.period ? Number(filters.period) : null;
  const ready = !!(year && filters.class && filters.section && (type === "DAILY" || period));
  const loadKey = ready ? `attendance:${year}:${filters.class}:${filters.section}:${date}:${type}:${period}` : null;

  // Period definitions let the user pick a named period instead of typing a number
  const periods = useQuery(year && type === "PERIOD" ? `periods:${year}` : null, () => listPeriods(year));
  const teachingPeriods = (periods.data ?? []).filter((p) => !p.is_break);

  const sheet = useQuery(loadKey, async () => {
    const [roster, records] = await Promise.all([
      getRoster(year, filters.class!, filters.section!),
      getClassAttendance(filters.class!, filters.section!, date, period),
    ]);
    // Keep only records for the selected daily/period attendance
    const relevant = records.filter((r) => (type === "PERIOD" ? r.period === period : r.period == null));
    return { roster, records: relevant };
  });

  // What the backend has stored for this date — a check that the save landed
  const summary = useQuery(ready ? `attendance-summary:${filters.class}:${filters.section}:${date}` : null, () =>
    getClassAttendanceSummary(filters.class!, filters.section!, date)
  );

  const savedMarks = useMemo(() => {
    const byStudent = new Map<string, AttendanceRecord>((sheet.data?.records ?? []).map((r) => [r.student_id, r]));
    const marks: Record<string, Mark> = {};
    for (const entry of sheet.data?.roster ?? []) {
      const record = byStudent.get(entry.studentId);
      marks[entry.studentId] = { status: record?.status ?? null, remarks: record?.remarks ?? "" };
    }
    return marks;
  }, [sheet.data]);

  // Unsaved edits live in a draft tied to the loaded sheet, so changing filters discards them
  const [draft, setDraft] = useState<{ key: string; marks: Record<string, Mark> } | null>(null);
  const isDirty = !!loadKey && draft?.key === loadKey;
  const marks = isDirty ? draft.marks : savedMarks;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);

  const updateMarks = (update: (current: Record<string, Mark>) => Record<string, Mark>) => {
    if (!loadKey) return;
    setSavedAt(null);
    setDraft({ key: loadKey, marks: update(marks) });
  };

  const setStatus = (studentId: string, status: AttendanceStatus) =>
    updateMarks((m) => ({ ...m, [studentId]: { ...m[studentId], status } }));

  const markAll = (status: AttendanceStatus) =>
    updateMarks((m) => Object.fromEntries(Object.entries(m).map(([id, mark]) => [id, { ...mark, status }])));

  const roster = sheet.data?.roster ?? [];
  const counts = ATTENDANCE_STATUSES.map((s) => ({ status: s, count: Object.values(marks).filter((m) => m.status === s).length }));
  const unmarked = Object.values(marks).filter((m) => !m.status).length;
  const alreadySaved = (sheet.data?.records.length ?? 0) > 0;

  // Numeric fields of the backend's class report, e.g. "Present 28 · Absent 2"
  const summaryText =
    summary.data && typeof summary.data === "object"
      ? Object.entries(summary.data as Record<string, unknown>)
          .filter((entry): entry is [string, number] => typeof entry[1] === "number")
          .map(([key, value]) => `${formatEnum(key)} ${/percent/i.test(key) ? `${Math.round(value * 10) / 10}%` : value}`)
          .join(" · ")
      : "";

  const handleSave = async () => {
    if (!ready) return;
    if (unmarked > 0) {
      setError(`Mark every student before saving (${unmarked} left).`);
      return;
    }
    setSaving(true);
    setError("");
    try {
      const entries = roster.map((r) => ({
        student_id: r.studentId,
        status: marks[r.studentId].status!,
        remarks: emptyToNull(marks[r.studentId].remarks),
      }));
      await markAttendanceBulk({
        class_id: filters.class!,
        section_id: filters.section!,
        academic_year_id: year,
        date: fromDateInput(date),
        attendance_type: type,
        period,
        entries,
      });
      // Show the saved marks immediately, then refresh from the server in the background
      sheet.setData((prev) => prev && { ...prev, records: entries.map((e) => ({ ...e, period })) });
      setDraft(null);
      setSavedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
      sheet.reload();
      summary.reload();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to save attendance"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Attendance" description="Mark attendance for a class section" />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ClassSectionPicker
          years={years}
          value={{ year, class: filters.class ?? "", section: filters.section ?? "" }}
          onChange={(v) => setFilters({ year: v.year, class: v.class, section: v.section })}
        />
        <Input
          type="date"
          aria-label="Date"
          value={date}
          max={todayInput()}
          onChange={(e) => setFilters({ date: e.target.value })}
          className="w-auto"
        />
        <Select aria-label="Attendance type" value={type} onChange={(e) => setFilters({ type: e.target.value, period: "" })} className="w-auto">
          <option value="DAILY">Daily</option>
          <option value="PERIOD">Per period</option>
        </Select>
        {type === "PERIOD" &&
          (teachingPeriods.length > 0 ? (
            <Select
              aria-label="Period"
              value={filters.period ?? ""}
              onChange={(e) => setFilters({ period: e.target.value })}
              className="w-auto min-w-44"
            >
              <option value="">Select period</option>
              {teachingPeriods.map((p) => (
                <option key={p.period_number} value={p.period_number}>
                  {p.name} ({p.start_time}–{p.end_time})
                </option>
              ))}
            </Select>
          ) : (
            // No periods defined for this year yet
            <Input
              type="number"
              min={1}
              aria-label="Period number"
              placeholder={periods.loading ? "Loading..." : "Period"}
              value={filters.period ?? ""}
              onChange={(e) => setFilters({ period: e.target.value })}
              className="w-24"
            />
          ))}
      </div>

      {!ready ? (
        <EmptyState>
          Select a class and section{type === "PERIOD" ? " and a period" : ""} to take attendance.
        </EmptyState>
      ) : sheet.loading ? (
        <Loading>Loading class roster...</Loading>
      ) : sheet.error ? (
        <Alert type="error">{sheet.error}</Alert>
      ) : roster.length === 0 ? (
        <EmptyState>
          No students are enrolled in this section.{" "}
          <Link href={`/dashboard/students?year=${year}&class=${filters.class}&section=${filters.section}`} className="underline">
            View students
          </Link>
        </EmptyState>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
            {counts.map(({ status, count }) => (
              <StatTile key={status} label={formatEnum(status)} value={count} />
            ))}
            <StatTile label="Not marked" value={unmarked} tone={unmarked ? "red" : undefined} />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted-foreground">
              {formatDate(date)}
              {type === "PERIOD" ? ` · Period ${period}` : ""} · {roster.length} students
              {alreadySaved && !isDirty && " · Saved earlier — changes will overwrite it"}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => markAll("PRESENT")}>All present</Button>
              <Button variant="outline" size="sm" onClick={() => markAll("HOLIDAY")}>Holiday</Button>
            </div>
          </div>

          <Table>
            <THead>
              <tr>
                <TH className="w-16">Roll</TH>
                <TH>Student</TH>
                <TH>Status</TH>
                <TH>Remarks</TH>
              </tr>
            </THead>
            <TBody>
              {roster.map(({ studentId, student, rollNumber }) => {
                const mark = marks[studentId];
                return (
                  <tr key={studentId} className={cn(!mark?.status && "bg-amber-50/60")}>
                    <TD className="font-mono">{rollNumber ?? "—"}</TD>
                    <TD className="font-medium">{studentLabel(student)}</TD>
                    <TD>
                      <div className="flex gap-1" role="group" aria-label={`Attendance for ${studentLabel(student)}`}>
                        {ATTENDANCE_STATUSES.map((s) => (
                          <button
                            key={s}
                            type="button"
                            title={formatEnum(s)}
                            aria-label={formatEnum(s)}
                            aria-pressed={mark?.status === s}
                            onClick={() => setStatus(studentId, s)}
                            className={cn(
                              "size-8 rounded-md border text-xs font-semibold transition-colors",
                              mark?.status === s ? STATUS_STYLES[s].active : "bg-white text-muted-foreground hover:bg-accent"
                            )}
                          >
                            {STATUS_STYLES[s].short}
                          </button>
                        ))}
                      </div>
                    </TD>
                    <TD>
                      <Input
                        aria-label={`Remarks for ${studentLabel(student)}`}
                        value={mark?.remarks ?? ""}
                        onChange={(e) => updateMarks((m) => ({ ...m, [studentId]: { ...m[studentId], remarks: e.target.value } }))}
                        className="h-8 min-w-40"
                      />
                    </TD>
                  </tr>
                );
              })}
            </TBody>
          </Table>

          {summaryText && <p className="text-xs text-muted-foreground">Recorded on the server for this date: {summaryText}</p>}

          {error && <Alert type="error">{error}</Alert>}
          {savedAt && <Alert type="success">Attendance saved at {savedAt}.</Alert>}

          <div className="sticky bottom-0 -mx-1 flex items-center justify-end gap-3 bg-gradient-to-t from-background via-background px-1 py-3">
            {isDirty && <span className="text-sm text-muted-foreground">Unsaved changes</span>}
            <Button onClick={handleSave} disabled={saving || (!isDirty && alreadySaved)}>
              {saving ? "Saving..." : "Save attendance"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
