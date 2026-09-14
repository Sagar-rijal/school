import { apiRequest, unwrap } from "./api";
import type {
  AcademicYear,
  AcademicYearPayload,
  AcademicYearUpdatePayload,
  ClassPayload,
  ClassUpdatePayload,
  SchoolClass,
  Section,
  SectionPayload,
  SectionUpdatePayload,
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

// ── Classes ──

export async function listClasses(filters: { academic_year_id?: string } = {}) {
  return unwrap<SchoolClass[]>(await apiRequest("/academic/classes", { query: filters }));
}

export async function getClass(classId: string) {
  return unwrap<SchoolClass>(await apiRequest(`/academic/classes/${classId}`));
}

export async function createClass(payload: ClassPayload) {
  return apiRequest("/academic/classes", { method: "POST", body: payload });
}

export async function updateClass(classId: string, payload: ClassUpdatePayload) {
  return apiRequest(`/academic/classes/${classId}`, { method: "PUT", body: payload });
}

export async function deleteClass(classId: string) {
  return apiRequest(`/academic/classes/${classId}`, { method: "DELETE" });
}

// ── Sections ──

export async function listSections(filters: { class_id?: string } = {}) {
  return unwrap<Section[]>(await apiRequest("/academic/sections", { query: filters }));
}

export async function createSection(payload: SectionPayload) {
  return apiRequest("/academic/sections", { method: "POST", body: payload });
}

export async function updateSection(sectionId: string, payload: SectionUpdatePayload) {
  return apiRequest(`/academic/sections/${sectionId}`, { method: "PUT", body: payload });
}

export async function deleteSection(sectionId: string) {
  return apiRequest(`/academic/sections/${sectionId}`, { method: "DELETE" });
}
