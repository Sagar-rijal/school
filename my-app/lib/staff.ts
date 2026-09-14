import { apiRequest, unwrap } from "./api";
import type {
  Department,
  DepartmentPayload,
  StaffFilters,
  StaffMember,
  StaffPayload,
  StaffUpdatePayload,
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
