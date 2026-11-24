import { ApiError, getId } from "./api";
import type { Session } from "./access";
import { getEnrollmentHistory, getStudent, listParents, listStudents } from "./students";
import type { Enrollment, Parent, Student } from "./types/student";

// The backend has no "my children" endpoint. A login is tied to its student or parent
// record by user_id (set when the record was created with a login) or by email, so the
// portal finds the signed-in user's record in the list the backend lets them see.

export type FamilyChild = {
  studentId: string;
  student: Student;
  /** Current enrollment (class/section/year), when visible. */
  enrollment: Enrollment | null;
};

export type Family = {
  role: "STUDENT" | "PARENT";
  children: FamilyChild[];
};

type Linkable = { user_id?: string | null; email?: string | null };

function findOwnRecord<T extends Linkable>(records: T[], session: Session): T | undefined {
  const email = session.email.trim().toLowerCase();
  return (
    records.find((r) => r.user_id && r.user_id === session.id) ??
    (email ? records.find((r) => r.email?.trim().toLowerCase() === email) : undefined) ??
    // The backend usually scopes these lists to the caller, so one record is theirs
    (records.length === 1 ? records[0] : undefined)
  );
}

/** Latest active enrollment; falls back to the most recent one. */
function currentEnrollment(history: Enrollment[]) {
  const active = history.filter((e) => !e.status || e.status === "ENROLLED");
  return active[active.length - 1] ?? history[history.length - 1] ?? null;
}

async function withEnrollment(studentId: string, student: Student): Promise<FamilyChild> {
  const history = await getEnrollmentHistory(studentId).catch(() => [] as Enrollment[]);
  return { studentId, student, enrollment: currentEnrollment(history) };
}

const NOT_LINKED = "Your login isn't linked to a student record yet. Please contact the school office.";

export async function resolveFamily(session: Session): Promise<Family> {
  if (session.roles.includes("PARENT")) {
    const parents = await listParents().catch((err) => {
      throw err instanceof ApiError && err.status === 403 ? new ApiError(NOT_LINKED, 403) : err;
    });
    const me = findOwnRecord<Parent>(parents, session);
    const ids = [...new Set(me?.student_ids ?? [])];
    if (!me || ids.length === 0) throw new ApiError("No children are linked to your account yet. Please contact the school office.", 404);
    const children = await Promise.all(
      ids.map(async (id) => {
        // A parent may not be allowed to load the full record; keep the child selectable anyway
        const student = await getStudent(id).catch(() => ({ _id: id, first_name: "", last_name: "", admission_number: id }) as Student);
        return withEnrollment(id, student);
      })
    );
    return { role: "PARENT", children };
  }

  const students = await listStudents().catch((err) => {
    throw err instanceof ApiError && err.status === 403 ? new ApiError(NOT_LINKED, 403) : err;
  });
  const me = findOwnRecord(students as (Student & Linkable)[], session);
  if (!me) throw new ApiError(NOT_LINKED, 404);
  return { role: "STUDENT", children: [await withEnrollment(getId(me), me)] };
}
