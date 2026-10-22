import { apiRequest, unwrapPage } from "./api";

export const EVENT_TYPES = ["HOLIDAY", "EXAM_DAY", "SPORTS_DAY", "PARENTS_MEETING", "WORKING_DAY", "OTHER"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export type CalendarEventPayload = {
  academic_year_id: string;
  title: string;
  event_type: EventType;
  description?: string | null;
  start_date: string;
  end_date: string;
  is_holiday: boolean;
};

export type CalendarEvent = CalendarEventPayload & { id?: string; _id?: string };

export async function listCalendarEvents(academicYearId?: string) {
  return unwrapPage<CalendarEvent>(
    await apiRequest("/calendar/events", { query: { academic_year_id: academicYearId } })
  ).items;
}

export function createCalendarEvent(payload: CalendarEventPayload) {
  return apiRequest("/calendar/events", { method: "POST", body: payload });
}
