import { ApiError, apiRequest, unwrap } from "./api";
import type { School, SchoolCreation, SchoolPayload } from "./types/school";

export async function getAllSchools() {
  return unwrap<School[]>(await apiRequest("/tenant"));
}

export async function getSchool(schoolId: string) {
  return unwrap<School>(await apiRequest(`/tenant/${schoolId}`));
}

export async function addSchool(payload: SchoolPayload) {
  return unwrap<SchoolCreation>(await apiRequest("/tenant/addSchool", { method: "POST", body: payload }));
}

export async function updateSchool(schoolId: string, payload: Partial<SchoolPayload>) {
  return unwrap<School>(await apiRequest(`/tenant/${schoolId}`, {
    method: "PUT",
    body: payload,
  }));
}

/** Recheck status before deletion; the backend must enforce this rule too. */
export async function deleteSchool(schoolId: string) {
  const school = await getSchool(schoolId);
  if (school.status !== 0) {
    throw new ApiError("Only disabled schools can be deleted.", 409);
  }
  try {
    return await apiRequest(`/tenant/${encodeURIComponent(schoolId)}`, { method: "DELETE" });
  } catch (err) {
    if (err instanceof ApiError && err.status === 405) {
      throw new ApiError("School deletion is not available in the backend yet.", 405);
    }
    throw err;
  }
}
