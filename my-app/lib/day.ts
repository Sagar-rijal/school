import { DAYS_OF_WEEK, type DayOfWeek } from "./types/timetable";

/** Today as a DayOfWeek (DAYS_OF_WEEK starts on Monday, Date#getDay on Sunday). */
export function todayDay(): DayOfWeek {
  return DAYS_OF_WEEK[(new Date().getDay() + 6) % 7];
}
