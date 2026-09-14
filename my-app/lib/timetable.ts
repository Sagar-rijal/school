import { apiRequest, unwrap } from "./api";
import {
  DAYS_OF_WEEK,
  type BulkTimetablePayload,
  type DayOfWeek,
  type PeriodDefinition,
  type PeriodDefinitionPayload,
  type PeriodDefinitionUpdatePayload,
  type TimetableEntry,
  type TimetableEntryPayload,
  type TimetableEntryUpdatePayload,
} from "./types/timetable";

// ── Period definitions ──

export async function listPeriods(academicYearId?: string) {
  const res = await apiRequest("/timetable/periods", { query: { academic_year_id: academicYearId } });
  return (unwrap<PeriodDefinition[]>(res) ?? []).sort((a, b) => a.period_number - b.period_number);
}

export function createPeriod(payload: PeriodDefinitionPayload) {
  return apiRequest("/timetable/periods", { method: "POST", body: payload });
}

export function updatePeriod(periodId: string, payload: PeriodDefinitionUpdatePayload) {
  return apiRequest(`/timetable/periods/${periodId}`, { method: "PUT", body: payload });
}

export function deletePeriod(periodId: string) {
  return apiRequest(`/timetable/periods/${periodId}`, { method: "DELETE" });
}

// ── Entries ──

/** Adds or replaces the slot for that day + period. The backend rejects teacher clashes. */
export function saveTimetableEntry(payload: TimetableEntryPayload) {
  return apiRequest("/timetable/entries", { method: "POST", body: payload });
}

export function updateTimetableEntry(entryId: string, payload: TimetableEntryUpdatePayload) {
  return apiRequest(`/timetable/entries/${entryId}`, { method: "PUT", body: payload });
}

export function deleteTimetableEntry(entryId: string) {
  return apiRequest(`/timetable/entries/${entryId}`, { method: "DELETE" });
}

/** Uploads many slots at once; slots in the upload replace existing ones. */
export function bulkUploadTimetable(payload: BulkTimetablePayload) {
  return apiRequest("/timetable/bulk", { method: "POST", body: payload });
}

export function clearClassTimetable(classId: string, sectionId: string, academicYearId: string) {
  return apiRequest(`/timetable/class/${classId}/${sectionId}`, {
    method: "DELETE",
    query: { academic_year_id: academicYearId },
  });
}

export async function getClassWeeklyTimetable(classId: string, sectionId: string, academicYearId: string) {
  const res = await apiRequest(`/timetable/class/${classId}/${sectionId}/weekly`, { query: { academic_year_id: academicYearId } });
  return normalizeWeekly(unwrap(res));
}

export async function getTeacherWeeklySchedule(staffId: string, academicYearId: string) {
  const res = await apiRequest(`/timetable/teacher/${staffId}/weekly`, { query: { academic_year_id: academicYearId } });
  return normalizeWeekly(unwrap(res));
}

// ── Weekly response ──

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);
const isDay = (v: unknown): v is DayOfWeek => typeof v === "string" && (DAYS_OF_WEEK as readonly string[]).includes(v.toUpperCase());

function toEntry(item: unknown, day?: DayOfWeek): TimetableEntry | null {
  if (!isObject(item)) return null;
  const rawDay = item.day_of_week ?? item.day ?? day;
  const periodNumber = Number(item.period_number ?? item.period);
  if (!isDay(rawDay) || !Number.isFinite(periodNumber)) return null;
  return { ...(item as TimetableEntry), day_of_week: String(rawDay).toUpperCase() as DayOfWeek, period_number: periodNumber };
}

/**
 * The weekly endpoints return a schedule "grouped by day of week", but the exact
 * shape isn't documented. Accepts a flat list of entries, an object keyed by day
 * ({ MONDAY: [...] }), or a list of { day, periods|entries } groups.
 */
export function normalizeWeekly(raw: unknown): TimetableEntry[] {
  const source = isObject(raw) && (Array.isArray(raw.days) || Array.isArray(raw.schedule)) ? (raw.days ?? raw.schedule) : raw;
  const out: TimetableEntry[] = [];

  if (Array.isArray(source)) {
    for (const item of source) {
      const nested = isObject(item) ? (item.periods ?? item.entries ?? item.slots) : undefined;
      if (Array.isArray(nested)) {
        const day = (isObject(item) ? item.day_of_week ?? item.day : undefined) as DayOfWeek | undefined;
        nested.forEach((n) => {
          const entry = toEntry(n, isDay(day) ? (String(day).toUpperCase() as DayOfWeek) : undefined);
          if (entry) out.push(entry);
        });
      } else {
        const entry = toEntry(item);
        if (entry) out.push(entry);
      }
    }
  } else if (isObject(source)) {
    for (const [key, value] of Object.entries(source)) {
      if (!isDay(key) || !Array.isArray(value)) continue;
      value.forEach((v) => {
        const entry = toEntry(v, key.toUpperCase() as DayOfWeek);
        if (entry) out.push(entry);
      });
    }
  }
  return out;
}
