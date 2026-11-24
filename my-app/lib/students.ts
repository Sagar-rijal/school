import { apiRequest, getId, unwrap } from "./api";
import type {
  Enrollment,
  EnrollmentPayload,
  EnrollmentUpdatePayload,
  Parent,
  ParentPayload,
  ParentUpdatePayload,
  RosterEntry,
  Student,
  StudentFilters,
  StudentPayload,
  StudentUpdatePayload,
} from "./types/student";
import { fullName } from "./utils";

// ── Students ──

export async function listStudents(filters: StudentFilters = {}) {
  return unwrap<Student[]>(await apiRequest("/students", { query: filters })) ?? [];
}

export async function getStudent(studentId: string) {
  return unwrap<Student>(await apiRequest(`/students/${studentId}`));
}

export function createStudent(payload: StudentPayload) {
  return apiRequest("/students", { method: "POST", body: payload });
}

export function updateStudent(studentId: string, payload: StudentUpdatePayload) {
  return apiRequest(`/students/${studentId}`, { method: "PUT", body: payload });
}

export function deleteStudent(studentId: string) {
  return apiRequest(`/students/${studentId}`, { method: "DELETE" });
}

// ── Parents ──

export async function listParents() {
  return unwrap<Parent[]>(await apiRequest("/students/parents")) ?? [];
}

export async function getParent(parentId: string) {
  return unwrap<Parent>(await apiRequest(`/students/parents/${parentId}`));
}

export function createParent(payload: ParentPayload) {
  return apiRequest("/students/parents", { method: "POST", body: payload });
}

export function updateParent(parentId: string, payload: ParentUpdatePayload) {
  return apiRequest(`/students/parents/${parentId}`, { method: "PUT", body: payload });
}

export function deleteParent(parentId: string) {
  return apiRequest(`/students/parents/${parentId}`, { method: "DELETE" });
}

export async function getParentsOfStudent(studentId: string) {
  return unwrap<Parent[]>(await apiRequest(`/students/${studentId}/parents`)) ?? [];
}

export function linkParent(parentId: string, studentId: string) {
  return apiRequest(`/students/parents/${parentId}/link/${studentId}`, { method: "POST" });
}

export function unlinkParent(parentId: string, studentId: string) {
  return apiRequest(`/students/parents/${parentId}/unlink/${studentId}`, { method: "DELETE" });
}

// ── Enrollments ──

export function enrollStudent(payload: EnrollmentPayload) {
  return apiRequest("/students/enrollments", { method: "POST", body: payload });
}

export async function getEnrollmentHistory(studentId: string) {
  return unwrap<Enrollment[]>(await apiRequest(`/students/${studentId}/enrollments`)) ?? [];
}

export function updateEnrollment(enrollmentId: string, payload: EnrollmentUpdatePayload) {
  return apiRequest(`/students/enrollments/${enrollmentId}`, { method: "PUT", body: payload });
}

export async function getClassRoster(classId: string, sectionId: string, academicYearId?: string) {
  return (
    unwrap<unknown[]>(
      await apiRequest(`/students/enrollments/roster/${classId}/${sectionId}`, {
        query: { academic_year_id: academicYearId },
      })
    ) ?? []
  );
}

// ── Roster (students of a class/section with roll numbers) ──

type Json = Record<string, unknown>;
const isObject = (v: unknown): v is Json => typeof v === "object" && v !== null && !Array.isArray(v);

/**
 * Students of a class (and optionally a section) for an academic year.
 *
 * The roster endpoint's response isn't documented — it may list enrollments (with or
 * without embedded student details) or students. So the filtered student list is used
 * for student details and the roster only adds roll numbers (and any students missing
 * from the list).
 */
export async function getRoster(academicYearId: string, classId: string, sectionId?: string): Promise<RosterEntry[]> {
  const [students, roster] = await Promise.all([
    listStudents({ academic_year_id: academicYearId, class_id: classId, section_id: sectionId }),
    sectionId ? getClassRoster(classId, sectionId, academicYearId).catch(() => []) : Promise.resolve([]),
  ]);

  const entries = new Map<string, RosterEntry>();
  for (const student of students) {
    entries.set(getId(student), { studentId: getId(student), student, rollNumber: null });
  }

  for (const item of roster) {
    if (!isObject(item)) continue;
    const embedded = isObject(item.student) ? (item.student as Student) : "first_name" in item ? (item as Student) : null;
    const studentId =
      (typeof item.student_id === "string" && item.student_id) || (embedded ? getId(embedded) : "");
    if (!studentId) continue;

    const rollNumber = typeof item.roll_number === "string" || typeof item.roll_number === "number" ? String(item.roll_number) : null;
    const existing = entries.get(studentId);
    if (existing) {
      existing.rollNumber = rollNumber ?? existing.rollNumber;
    } else {
      entries.set(studentId, {
        studentId,
        rollNumber,
        student: embedded ?? ({ _id: studentId, first_name: "", last_name: "", admission_number: studentId } as Student),
      });
    }
  }

  return [...entries.values()].sort((a, b) => {
    if (a.rollNumber && b.rollNumber) return a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true });
    if (a.rollNumber || b.rollNumber) return a.rollNumber ? -1 : 1;
    return fullName(a.student).localeCompare(fullName(b.student));
  });
}

/** Display name, falling back to the admission number when details are missing. */
export function studentLabel(student: Student) {
  return fullName(student) || student.admission_number || "Unknown student";
}

// ── Roll numbers (policies and per-enrollment assignments) ──

export const ROLL_UNIQUE_SCOPES = ["SECTION", "CLASS", "SCHOOL"] as const;

export type RollPolicy = {
  id?: string;
  _id?: string;
  academic_year_id: string;
  class_id: string;
  roll_type: string;
  context?: Record<string, string>;
  unique_scope?: (typeof ROLL_UNIQUE_SCOPES)[number];
  enabled?: boolean;
  reason?: string;
  created_at?: string;
};

export type StudentRoll = {
  id?: string;
  _id?: string;
  enrollment_id?: string;
  academic_year_id?: string;
  class_id?: string;
  section_id?: string;
  roll_type?: string;
  value?: string | null;
  context?: Record<string, string>;
  updated_at?: string;
};

export async function listRollPolicies(filters: { academic_year_id?: string; class_id?: string } = {}) {
  const value = unwrap<unknown>(await apiRequest("/students/roll-policies", { query: filters }));
  if (Array.isArray(value)) return value as RollPolicy[];
  const page = (value ?? {}) as { items?: RollPolicy[]; policies?: RollPolicy[] };
  return page.items ?? page.policies ?? [];
}

export function configureRollPolicy(payload: Omit<RollPolicy, "id" | "_id" | "created_at"> & { reason: string }) {
  return apiRequest("/students/roll-policies", { method: "POST", body: payload });
}

/** Shows what migrating legacy roll numbers into the policy model would change. Read-only. */
export async function previewLegacyRollMigration() {
  return unwrap<unknown>(await apiRequest("/students/roll-migration/dry-run"));
}

export async function getStudentRolls(studentId: string) {
  const value = unwrap<unknown>(await apiRequest(`/students/${studentId}/rolls`));
  if (Array.isArray(value)) return value as StudentRoll[];
  const page = (value ?? {}) as { items?: StudentRoll[]; rolls?: StudentRoll[] };
  return page.items ?? page.rolls ?? [];
}

/** value null clears the roll. A reason is required for the audit trail. */
export function changeStudentRoll(enrollmentId: string, payload: { roll_type: string; value: string | null; reason: string; context?: Record<string, string> }) {
  return apiRequest(`/students/enrollments/${enrollmentId}/rolls`, { method: "PUT", body: payload });
}

/** Student with enrollments, parents and related details in one response. */
export async function getStudentDetails(studentId: string) {
  return unwrap<Record<string, unknown>>(await apiRequest(`/students/${studentId}/details`));
}
