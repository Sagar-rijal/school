// Mirrors AcademicYearCreate / AcademicYearUpdate from the backend OpenAPI spec

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
