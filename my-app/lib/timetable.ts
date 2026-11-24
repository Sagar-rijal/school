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

export async function getPeriod(periodId: string) {
  return unwrap<PeriodDefinition>(await apiRequest(`/timetable/periods/${periodId}`));
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

/** Single-slot update. The UI posts to /timetable/entries instead, which replaces the slot for that day+period. */
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

export async function getClassDayTimetable(classId: string, sectionId: string, day: DayOfWeek, academicYearId: string) {
  const res = await apiRequest(`/timetable/class/${classId}/${sectionId}/day/${day}`, { query: { academic_year_id: academicYearId } });
  return normalizeWeekly(unwrap(res), day);
}

export async function getTeacherDaySchedule(staffId: string, day: DayOfWeek, academicYearId: string) {
  const res = await apiRequest(`/timetable/teacher/${staffId}/day/${day}`, { query: { academic_year_id: academicYearId } });
  return normalizeWeekly(unwrap(res), day);
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
 *
 * `defaultDay` is used for day-scoped responses whose entries omit the day.
 */
export function normalizeWeekly(raw: unknown, defaultDay?: DayOfWeek): TimetableEntry[] {
  const source = isObject(raw) && (Array.isArray(raw.days) || Array.isArray(raw.schedule)) ? (raw.days ?? raw.schedule) : raw;
  const out: TimetableEntry[] = [];

  if (Array.isArray(source)) {
    for (const item of source) {
      const nested = isObject(item) ? (item.periods ?? item.entries ?? item.slots) : undefined;
      if (Array.isArray(nested)) {
        const day = (isObject(item) ? item.day_of_week ?? item.day : undefined) as DayOfWeek | undefined;
        nested.forEach((n) => {
          const entry = toEntry(n, isDay(day) ? (String(day).toUpperCase() as DayOfWeek) : defaultDay);
          if (entry) out.push(entry);
        });
      } else {
        const entry = toEntry(item, defaultDay);
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

// ── Versioned releases (draft → publish, with dated overrides) ──

export type TimetableRelease = {
  id?: string;
  _id?: string;
  release_id?: string;
  status?: string;
  revision?: number;
  draft_version?: number;
  effective_from?: string;
  published_at?: string;
};

export type PublishedTimetable = {
  release?: TimetableRelease;
  revision: number;
  releaseId: string;
  effectiveFrom?: string;
  entries: TimetableEntry[];
};

export function releaseId(r?: TimetableRelease | null) {
  return r?.release_id ?? r?.id ?? r?._id ?? "";
}

type Json2 = Record<string, unknown>;

/** Published response shape isn't documented: accepts { release, entries } or a flat release with entries. */
function toPublished(raw: unknown): PublishedTimetable {
  const obj = (raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}) as Json2;
  const release = (obj.release && typeof obj.release === "object" ? obj.release : obj) as TimetableRelease & Json2;
  const entriesSource = obj.entries ?? obj.schedule ?? obj.days ?? release.entries ?? (Array.isArray(raw) ? raw : []);
  return {
    release,
    revision: Number(release.revision ?? obj.revision ?? 0) || 0,
    releaseId: releaseId(release) || String(obj.release_id ?? ""),
    effectiveFrom: (release.effective_from ?? obj.effective_from) as string | undefined,
    entries: normalizeWeekly(entriesSource),
  };
}

export async function getPublishedClassTimetable(classId: string, sectionId: string, academicYearId: string, asOf?: string) {
  const res = await apiRequest(`/timetable/class/${classId}/${sectionId}/published`, { query: { academic_year_id: academicYearId, as_of: asOf } });
  return toPublished(unwrap(res));
}

/**
 * Saves a draft release. expected_revision is the currently published revision (0 if none),
 * so a draft built on stale data is rejected.
 */
export async function saveTimetableDraft(payload: {
  academic_year_id: string;
  class_id: string;
  section_id: string;
  effective_from: string;
  expected_revision: number;
  expected_draft_version?: number;
  entries: Omit<TimetableEntryPayload, "academic_year_id" | "class_id" | "section_id">[];
}) {
  return unwrap<TimetableRelease>(await apiRequest("/timetable/releases/drafts", { method: "POST", body: payload }));
}

export function publishTimetableRelease(id: string, revision: number) {
  return apiRequest(`/timetable/releases/${encodeURIComponent(id)}/publish`, { method: "POST", body: { revision } });
}

/** One-day change: a substitute teacher or a cancelled period. */
export function addTimetableOverride(id: string, payload: { schedule_date: string; period_number: number; action: "SUBSTITUTE" | "CANCEL"; substitute_teacher_id?: string | null; reason: string }) {
  return apiRequest(`/timetable/releases/${encodeURIComponent(id)}/overrides`, { method: "POST", body: payload });
}

/** Student / parent views of the published timetable. */
export async function getMyStudentSchedule(asOf?: string) {
  return toPublished(unwrap(await apiRequest("/timetable/student/me/published", { query: { as_of: asOf } })));
}

export async function getLinkedStudentSchedule(studentId: string, asOf?: string) {
  return toPublished(unwrap(await apiRequest(`/timetable/student/${encodeURIComponent(studentId)}/published`, { query: { as_of: asOf } })));
}
