// Mirrors the Timetable schemas from the backend OpenAPI spec

export const DAYS_OF_WEEK = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"] as const;
export const SLOT_TYPES = ["LECTURE", "LAB", "LIBRARY", "SPORTS", "BREAK", "ASSEMBLY", "FREE"] as const;

export type DayOfWeek = (typeof DAYS_OF_WEEK)[number];
export type SlotType = (typeof SLOT_TYPES)[number];

// ── Period definitions ──

export type PeriodDefinitionPayload = {
  academic_year_id: string;
  period_number: number;
  name: string;
  start_time: string; // "HH:MM"
  end_time: string;
  slot_type: SlotType;
  is_break: boolean;
};

export type PeriodDefinitionUpdatePayload = Partial<Pick<PeriodDefinitionPayload, "name" | "start_time" | "end_time" | "slot_type" | "is_break">>;

export type PeriodDefinition = PeriodDefinitionPayload & { _id?: string; id?: string };

// ── Entries ──

export type TimetableEntryPayload = {
  academic_year_id: string;
  class_id: string;
  section_id: string;
  day_of_week: DayOfWeek;
  period_number: number;
  subject_id?: string | null;
  /** Staff record ID (not the login user ID). */
  staff_id?: string | null;
  room?: string | null;
  slot_type: SlotType;
  remarks?: string | null;
};

export type TimetableEntryUpdatePayload = Partial<Pick<TimetableEntryPayload, "subject_id" | "staff_id" | "room" | "slot_type" | "remarks">>;

export type TimetableEntry = TimetableEntryPayload & { _id?: string; id?: string };

export type BulkTimetablePayload = {
  academic_year_id: string;
  class_id: string;
  section_id: string;
  entries: Omit<TimetableEntryPayload, "academic_year_id" | "class_id" | "section_id">[];
};
