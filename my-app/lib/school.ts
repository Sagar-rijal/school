import { apiRequest, unwrap } from "./api";
import type { School, SchoolPayload } from "./types/school";

export async function getAllSchools() {
  return unwrap<School[]>(await apiRequest("/tenant/"));
}

export async function getSchool(schoolId: string) {
  return unwrap<School>(await apiRequest(`/tenant/${schoolId}`));
}

export async function addSchool(payload: SchoolPayload) {
  return apiRequest("/tenant/addSchool", { method: "POST", body: payload });
}

export async function updateSchool(schoolId: string, payload: Partial<SchoolPayload>) {
  return apiRequest(`/tenant/${schoolId}`, { method: "PUT", body: payload });
}
