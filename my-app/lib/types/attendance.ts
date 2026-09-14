// Mirrors the Attendance schemas from the backend OpenAPI spec

export const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED", "HOLIDAY"] as const;
export const ATTENDANCE_TYPES = ["DAILY", "PERIOD"] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];
export type AttendanceType = (typeof ATTENDANCE_TYPES)[number];

export const ATTENDANCE_STATUS_TONES = {
  PRESENT: "green",
  ABSENT: "red",
  LATE: "yellow",
  EXCUSED: "blue",
  HOLIDAY: "gray",
} as const;

export type BulkAttendanceEntry = {
  student_id: string;
  status: AttendanceStatus;
  remarks?: string | null;
};

export type BulkAttendancePayload = {
  class_id: string;
  section_id: string;
  academic_year_id: string;
  date: string; // ISO date-time
  attendance_type: AttendanceType;
  /** Required when attendance_type is PERIOD. */
  period?: number | null;
  entries: BulkAttendanceEntry[];
};

export type AttendanceRecord = {
  _id?: string;
  id?: string;
  student_id: string;
  status: AttendanceStatus;
  remarks?: string | null;
  date?: string;
  period?: number | null;
  class_id?: string;
  section_id?: string;
};

export type AttendanceUpdatePayload = {
  status?: AttendanceStatus | null;
  remarks?: string | null;
};
