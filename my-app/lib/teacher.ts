import { apiRequest, unwrap } from "./api";

export type PublishedLesson = {
  date?: string;
  day_of_week?: string;
  period_number?: number;
  start_time?: string;
  end_time?: string;
  class_id?: string;
  section_id?: string;
  subject_id?: string;
  room?: string;
  slot_type?: string;
  title?: string;
};

/** Published schedules have no response schema yet; accept flat and day-grouped lists. */
export function normalizePublishedLessons(raw: unknown): PublishedLesson[] {
  const output: PublishedLesson[] = [];
  const visit = (value: unknown, date?: string, depth = 0) => {
    if (depth > 5 || !value) return;
    if (Array.isArray(value)) {
      value.forEach((item) => visit(item, date, depth + 1));
      return;
    }
    if (typeof value !== "object") return;
    const record = value as Record<string, unknown>;
    const ownDate = typeof record.date === "string" ? record.date : date;
    const nested = [record.items, record.entries, record.slots, record.periods, record.schedule, record.days,
      record.lessons, record.timetable, record.week]
      .find((item) => Array.isArray(item) || (item && typeof item === "object"));
    if (nested) {
      visit(nested, ownDate, depth + 1);
      return;
    }
    const datedGroups = Object.entries(record).filter(([key, item]) =>
      (Array.isArray(item) || (item && typeof item === "object")) && /^(\d{4}-\d{2}-\d{2}|MONDAY|TUESDAY|WEDNESDAY|THURSDAY|FRIDAY|SATURDAY|SUNDAY)$/i.test(key));
    if (datedGroups.length) {
      datedGroups.forEach(([key, item]) => visit(item, key, depth + 1));
      return;
    }
    if (record.class_id || record.subject_id || record.period_number || record.start_time || record.title) {
      output.push({ ...(record as PublishedLesson), date: ownDate });
    }
  };
  visit(raw);
  return output.sort((a, b) => `${a.date ?? a.day_of_week ?? ""}:${String(a.period_number ?? 0).padStart(3, "0")}`
    .localeCompare(`${b.date ?? b.day_of_week ?? ""}:${String(b.period_number ?? 0).padStart(3, "0")}`));
}

export async function getMyPublishedSchedule(fromDate: string, toDate: string) {
  const response = await apiRequest("/timetable/teacher/me/published", {
    query: { from_date: fromDate, to_date: toDate },
  });
  return normalizePublishedLessons(unwrap(response));
}
