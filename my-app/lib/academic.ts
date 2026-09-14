import { apiRequest, unwrap } from "./api";
import type {
  AcademicYear,
  AcademicYearPayload,
  AcademicYearUpdatePayload,
} from "./types/academic";

// ── Academic years ──

export async function listAcademicYears() {
  return unwrap<AcademicYear[]>(await apiRequest("/academic/years"));
}

export async function getCurrentAcademicYear() {
  return unwrap<AcademicYear | null>(await apiRequest("/academic/years/current"));
}

export async function getAcademicYear(yearId: string) {
  return unwrap<AcademicYear>(await apiRequest(`/academic/years/${yearId}`));
}

export async function createAcademicYear(payload: AcademicYearPayload) {
  return apiRequest("/academic/years", { method: "POST", body: payload });
}

export async function updateAcademicYear(yearId: string, payload: AcademicYearUpdatePayload) {
  return apiRequest(`/academic/years/${yearId}`, { method: "PUT", body: payload });
}
