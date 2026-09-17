// Mirrors the Exams schemas from the backend OpenAPI spec

export const EXAM_TYPES = ["UNIT_TEST", "MID_TERM", "FINAL", "INTERNAL", "PRACTICAL", "PROJECT"] as const;
export const EXAM_STATUSES = ["SCHEDULED", "ONGOING", "COMPLETED", "CANCELLED"] as const;

export type ExamType = (typeof EXAM_TYPES)[number];
export type ExamStatus = (typeof EXAM_STATUSES)[number];

export const EXAM_STATUS_TONES = {
  SCHEDULED: "blue",
  ONGOING: "yellow",
  COMPLETED: "green",
  CANCELLED: "gray",
} as const;

// ── Schedules ──

export type ExamSchedulePayload = {
  academic_year_id: string;
  class_id: string;
  /** Empty means the exam is for every section of the class. */
  section_id?: string | null;
  subject_id: string;
  name: string;
  exam_type: ExamType;
  exam_date: string; // ISO date-time
  start_time?: string | null; // "HH:MM"
  end_time?: string | null;
  max_marks: number;
  passing_marks: number;
  venue?: string | null;
};

export type ExamScheduleUpdatePayload = Partial<
  Pick<ExamSchedulePayload, "name" | "exam_date" | "start_time" | "end_time" | "max_marks" | "passing_marks" | "venue">
> & { status?: ExamStatus | null };

export type ExamSchedule = ExamSchedulePayload & {
  _id?: string;
  id?: string;
  status?: ExamStatus;
};

export type ExamFilters = {
  academic_year_id?: string;
  class_id?: string;
  subject_id?: string;
  exam_type?: string;
  status?: string;
};

// ── Marks ──

export type MarksEntry = {
  student_id: string;
  marks_obtained?: number | null;
  is_absent: boolean;
  is_exempted: boolean;
  remarks?: string | null;
};

export type BulkMarksPayload = {
  exam_id: string;
  entries: MarksEntry[];
};

export type ExamResultUpdatePayload = Partial<Omit<MarksEntry, "student_id">>;

/** Grade, percentage and pass/fail are computed by the backend (field names not documented). */
export type ExamResult = MarksEntry & {
  _id?: string;
  id?: string;
  exam_id: string;
  grade?: string | null;
  percentage?: number | null;
  is_passed?: boolean | null;
  passed?: boolean | null;
  is_pass?: boolean | null;
};

// ── Report cards ──

export type ReportCardGeneratePayload = {
  academic_year_id: string;
  class_id: string;
  section_id: string;
  exam_type: ExamType;
};

/** Undocumented response; common field names are read defensively (see lib/exams.ts). */
export type ReportCard = {
  _id?: string;
  id?: string;
  student_id: string;
  academic_year_id?: string;
  class_id?: string;
  section_id?: string;
  exam_type?: string;
  [key: string]: unknown;
};
