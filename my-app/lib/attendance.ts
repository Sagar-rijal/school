import { apiRequest, unwrap } from "./api";
import type { AttendanceRecord, AttendanceUpdatePayload, BulkAttendancePayload } from "./types/attendance";
import { fromDateInput } from "./utils";

/** Start/end of a day as date-time strings, from YYYY-MM-DD. */
const dayStart = (date: string) => fromDateInput(date);
const dayEnd = (date: string) => `${date}T23:59:59`;

/** Marks a whole class/section at once. Re-submitting the same date/period overwrites. */
export function markAttendanceBulk(payload: BulkAttendancePayload) {
  return apiRequest("/attendance/bulk", { method: "POST", body: payload });
}

/** Single-record correction. The UI re-saves the whole class via /attendance/bulk, which the spec says overwrites. */
export function updateAttendanceRecord(recordId: string, payload: AttendanceUpdatePayload) {
  return apiRequest(`/attendance/${recordId}`, { method: "PUT", body: payload });
}

export async function getClassAttendance(classId: string, sectionId: string, date: string, period?: number | null) {
  const res = await apiRequest(`/attendance/class/${classId}/${sectionId}`, {
    query: { date: dayStart(date), period: period ?? undefined },
  });
  return unwrap<AttendanceRecord[]>(res) ?? [];
}

export async function getStudentAttendance(studentId: string, fromDate: string, toDate: string) {
  const res = await apiRequest(`/attendance/student/${studentId}`, {
    query: { from_date: dayStart(fromDate), to_date: dayEnd(toDate) },
  });
  return unwrap<AttendanceRecord[]>(res) ?? [];
}

/** Aggregated stats (percentage, present/absent/late counts). Shape isn't documented. */
export async function getStudentAttendanceSummary(studentId: string, fromDate: string, toDate: string) {
  return unwrap<unknown>(
    await apiRequest(`/attendance/report/student/${studentId}`, {
      query: { from_date: dayStart(fromDate), to_date: dayEnd(toDate) },
    })
  );
}

export async function getClassAttendanceSummary(classId: string, sectionId: string, date: string) {
  return unwrap<unknown>(
    await apiRequest(`/attendance/report/class/${classId}/${sectionId}`, { query: { date: dayStart(date) } })
  );
}
