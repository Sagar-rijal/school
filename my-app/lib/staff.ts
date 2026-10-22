import { ApiError, apiRequest, unwrap, unwrapPage } from "./api";
import type {
  Department,
  DepartmentPayload,
  StaffFilters,
  StaffMember,
  StaffPayload,
  StaffUpdatePayload,
  SalaryChangePayload,
  SalaryRecord,
} from "./types/staff";

// ── Departments ──

export async function listDepartments() {
  return unwrap<Department[]>(await apiRequest("/staff/departments")) ?? [];
}

export function createDepartment(payload: DepartmentPayload) {
  return apiRequest("/staff/departments", { method: "POST", body: payload });
}

export function updateDepartment(deptId: string, payload: Partial<DepartmentPayload>) {
  return apiRequest(`/staff/departments/${deptId}`, { method: "PUT", body: payload });
}

export function deleteDepartment(deptId: string) {
  return apiRequest(`/staff/departments/${deptId}`, { method: "DELETE" });
}

// ── Staff ──

/** StaffCreate has no status — new staff start as active. */
export function toStaffCreate(result: StaffPayload & { status?: unknown }): StaffPayload {
  const payload = { ...result };
  delete payload.status;
  return payload;
}

/** StaffUpdate can't change employee ID, staff type or joining date. */
export function toStaffUpdate(result: StaffPayload & { status?: StaffUpdatePayload["status"] }): StaffUpdatePayload {
  const payload: Partial<typeof result> = { ...result };
  delete payload.employee_id;
  delete payload.staff_type;
  delete payload.joining_date;
  return payload;
}

export async function listStaff(filters: StaffFilters = {}) {
  return unwrap<StaffMember[]>(await apiRequest("/staff", { query: filters })) ?? [];
}

export async function getStaffMember(staffId: string) {
  return unwrap<StaffMember>(await apiRequest(`/staff/${staffId}`));
}

export function createStaff(payload: StaffPayload) {
  return apiRequest("/staff", { method: "POST", body: payload });
}

export function updateStaff(staffId: string, payload: StaffUpdatePayload) {
  return apiRequest(`/staff/${staffId}`, { method: "PUT", body: payload });
}

export function deleteStaff(staffId: string) {
  return apiRequest(`/staff/${staffId}`, { method: "DELETE" });
}

export async function listTeachersBySubject(subjectId: string) {
  return unwrap<StaffMember[]>(await apiRequest(`/staff/by-subject/${subjectId}`)) ?? [];
}

// ── Salary ──

export async function getCurrentSalary(staffId: string): Promise<SalaryRecord | null> {
  try {
    const value = unwrap<unknown>(await apiRequest(`/staff/${encodeURIComponent(staffId)}/salary`));
    if (!value || typeof value !== "object") return null;
    const record = value as Record<string, unknown>;
    const nested = record.current ?? record.salary ?? record.current_salary;
    if (nested && typeof nested === "object") {
      const salary = nested as SalaryRecord;
      return { ...salary, revision: salary.revision ?? (typeof record.revision === "number" ? record.revision : undefined) };
    }
    return "amount" in record || "revision" in record ? record as SalaryRecord : null;
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export async function getSalaryHistory(staffId: string, after?: string) {
  return unwrapPage<SalaryRecord>(
    await apiRequest(`/staff/${encodeURIComponent(staffId)}/salary/history`, { query: { limit: 50, after } })
  );
}

export function changeSalary(staffId: string, payload: SalaryChangePayload) {
  return apiRequest(`/staff/${encodeURIComponent(staffId)}/salary`, {
    method: "POST",
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: payload,
  });
}
