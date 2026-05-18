// src/lib/school.ts
import { apiRequest } from "./api";
import { SchoolPayload } from "./type";

export function addSchool(schoolData: SchoolPayload) {
  return apiRequest("/tenant/addSchool", {
    method: "POST",
    body: schoolData,
  });
}

export function getSchool(schoolId: string) {
  return apiRequest(`/tenant/${schoolId}`, {
    method: "GET",
  });
}

export function updateSchool(schoolId: string, schoolData: SchoolPayload) {
  return apiRequest(`/tenant/${schoolId}`, {
    method: "PUT",
    body: schoolData,
  });
}