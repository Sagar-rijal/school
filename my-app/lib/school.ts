import { apiRequest } from "./api";
import { SchoolPayload } from "./type";

export function addSchool(schoolData: SchoolPayload) {
  const payload = {
    ...schoolData,
    school_info: {
      ...schoolData.school_info,
      establishedYear: Number(schoolData.school_info.establishedYear),
    },
  };
  return apiRequest("/tenant/addSchool", {
    method: "POST",
    body: payload,
  });
}
export function getAllSchool() {
  return apiRequest(`/tenant/`, {
    method: "GET",
  });
}
export function getSchool(schoolId: string) {
  return apiRequest(`/tenant/${schoolId}`, {
    method: "GET",
  });
}

export function updateSchool(schoolId: string, schoolData: SchoolPayload) {
  const payload = {
    ...schoolData,
    school_info: {
      ...schoolData.school_info,
      establishedYear: Number(schoolData.school_info.establishedYear),
    },
  };
  return apiRequest(`/tenant/${schoolId}`, {
    method: "PUT",
    body: payload,
  });
}
