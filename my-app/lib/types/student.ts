// Mirrors the Students schemas from the backend OpenAPI spec

export const GENDERS = ["MALE", "FEMALE", "OTHER"] as const;
export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"] as const;
export const STUDENT_STATUSES = ["ACTIVE", "INACTIVE", "TRANSFERRED", "GRADUATED", "DROPPED"] as const;
export const ENROLLMENT_STATUSES = ["ENROLLED", "PROMOTED", "REPEATED", "TRANSFERRED_OUT", "DROPPED"] as const;

export type Gender = (typeof GENDERS)[number];
export type BloodGroup = (typeof BLOOD_GROUPS)[number];
export type StudentStatus = (typeof STUDENT_STATUSES)[number];
export type EnrollmentStatus = (typeof ENROLLMENT_STATUSES)[number];

export const STUDENT_STATUS_TONES = {
  ACTIVE: "green",
  INACTIVE: "gray",
  TRANSFERRED: "yellow",
  GRADUATED: "blue",
  DROPPED: "red",
} as const;

export const ENROLLMENT_STATUS_TONES = {
  ENROLLED: "green",
  PROMOTED: "blue",
  REPEATED: "yellow",
  TRANSFERRED_OUT: "gray",
  DROPPED: "red",
} as const;

// ── Students ──

export type EmergencyContact = {
  name: string;
  relation: string;
  phone: string;
};

export type StudentPayload = {
  admission_number: string;
  first_name: string;
  last_name: string;
  date_of_birth: string; // ISO date-time
  gender: Gender;
  blood_group?: BloodGroup | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  emergency_contact?: EmergencyContact | null;
  profile_photo_url?: string | null;
};

/** The admission number can't be changed. */
export type StudentUpdatePayload = Partial<Omit<StudentPayload, "admission_number">> & {
  status?: StudentStatus | null;
};

export type Student = StudentPayload & {
  _id?: string;
  id?: string;
  status?: StudentStatus;
};

export type StudentFilters = {
  class_id?: string;
  section_id?: string;
  academic_year_id?: string;
  status?: string;
};

// ── Parents ──

export type ParentPayload = {
  first_name: string;
  last_name: string;
  email?: string | null;
  phone: string;
  address?: string | null;
  occupation?: string | null;
  profile_photo_url?: string | null;
  student_ids: string[];
  user_id?: string | null;
};

/** Student links are managed with the link/unlink endpoints. */
export type ParentUpdatePayload = Partial<Omit<ParentPayload, "student_ids" | "user_id">>;

export type Parent = ParentPayload & { _id?: string; id?: string };

// ── Enrollments ──

export type EnrollmentPayload = {
  student_id: string;
  academic_year_id: string;
  class_id: string;
  section_id: string;
  roll_number?: string | null;
};

export type EnrollmentUpdatePayload = {
  class_id?: string | null;
  section_id?: string | null;
  roll_number?: string | null;
  status?: EnrollmentStatus | null;
};

export type Enrollment = EnrollmentPayload & {
  _id?: string;
  id?: string;
  status?: EnrollmentStatus;
};

/** A student in a class/section, with their roll number when known. */
export type RosterEntry = {
  studentId: string;
  student: Student;
  rollNumber: string | null;
};
