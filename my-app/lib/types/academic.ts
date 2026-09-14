// Mirrors the Academics schemas from the backend OpenAPI spec

// ── Academic years ──

export type AcademicYearPayload = {
  name: string;
  start_date: string; // ISO date-time
  end_date: string; // ISO date-time
  is_current: boolean;
};

export type AcademicYearUpdatePayload = Partial<AcademicYearPayload>;

export type AcademicYear = AcademicYearPayload & {
  _id?: string;
  id?: string;
};

// ── Classes ──

export type ClassPayload = {
  academic_year_id: string;
  name: string;
  display_order: number;
};

/** The academic year can't be changed after creation. */
export type ClassUpdatePayload = Partial<Pick<ClassPayload, "name" | "display_order">>;

export type SchoolClass = ClassPayload & {
  _id?: string;
  id?: string;
};

// ── Sections ──

export type SectionPayload = {
  class_id: string;
  name: string;
  capacity: number;
};

// ── Subjects ──

export type SubjectPayload = {
  name: string;
  code: string;
  description?: string | null;
  /** Classes this subject is taught in. */
  class_ids: string[];
};

export type SubjectUpdatePayload = Partial<SubjectPayload>;

export type Subject = SubjectPayload & {
  _id?: string;
  id?: string;
};

/** A section can't be moved to another class. */
export type SectionUpdatePayload = Partial<Pick<SectionPayload, "name" | "capacity">>;

export type Section = SectionPayload & {
  _id?: string;
  id?: string;
};
