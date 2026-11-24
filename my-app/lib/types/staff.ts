// Mirrors the Staff schemas from the backend OpenAPI spec

export const STAFF_TYPES = ["TEACHING", "NON_TEACHING", "ADMINISTRATIVE"] as const;
export const EMPLOYMENT_TYPES = ["FULL_TIME", "PART_TIME", "CONTRACT", "GUEST"] as const;
export const STAFF_STATUSES = ["ACTIVE", "ON_LEAVE", "RESIGNED", "TERMINATED"] as const;

export type StaffType = (typeof STAFF_TYPES)[number];
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export type StaffStatus = (typeof STAFF_STATUSES)[number];

export const STAFF_STATUS_TONES = { ACTIVE: "green", ON_LEAVE: "yellow", RESIGNED: "gray", TERMINATED: "red" } as const;

// ── Departments ──

export type DepartmentPayload = {
  name: string;
  code: string;
  description?: string | null;
  head_staff_id?: string | null;
};

export type Department = DepartmentPayload & { _id?: string; id?: string };

// ── Staff ──

export type Qualification = {
  degree: string;
  institution: string;
  year: number;
};

export type StaffPayload = {
  employee_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address?: string | null;
  date_of_birth?: string | null; // ISO date-time
  gender?: string | null;
  profile_photo_url?: string | null;
  staff_type: StaffType;
  designation?: string | null;
  department_id?: string | null;
  employment_type: EmploymentType;
  subject_ids: string[];
  qualifications: Qualification[];
  joining_date: string; // ISO date-time
  /** Login account, needed for teacher assignments. */
  user_id?: string | null;
};

/** Employee ID, staff type and joining date can't be changed after onboarding. */
export type StaffUpdatePayload = Partial<
  Omit<StaffPayload, "employee_id" | "staff_type" | "joining_date">
> & { status?: StaffStatus | null };

export type StaffMember = StaffPayload & {
  _id?: string;
  id?: string;
  status?: StaffStatus;
};

/** POST /staff returns the new record and a password shown only at creation. */
export type StaffCreation = {
  staff: StaffMember;
  temp_password?: string | null;
};

export type StaffFilters = {
  department_id?: string;
  staff_type?: string;
  status?: string;
};

export const PAY_FREQUENCIES = ["MONTHLY", "WEEKLY", "DAILY", "HOURLY", "ANNUAL"] as const;
export type PayFrequency = (typeof PAY_FREQUENCIES)[number];

export type SalaryRecord = {
  _id?: string;
  id?: string;
  amount?: number | string;
  currency?: string;
  frequency?: PayFrequency;
  effective_at?: string;
  revision?: number;
  reason?: string;
  created_at?: string;
};

export type SalaryChangePayload = {
  amount: number;
  currency: "INR";
  frequency: PayFrequency;
  effective_at: string;
  reason: string;
  expected_revision: number;
};
