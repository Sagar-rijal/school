import { apiRequest, unwrap, unwrapPage } from "./api";

export const UNIT_STATUSES = ["PLANNED", "IN_PROGRESS", "COMPLETED"] as const;
export type UnitStatus = (typeof UNIT_STATUSES)[number];

export type SyllabusUnitPayload = {
  academic_year_id: string;
  class_id: string;
  subject_id: string;
  unit_number: number;
  title: string;
  description: string;
  estimated_hours?: number | null;
};

export type SyllabusUnit = SyllabusUnitPayload & {
  id?: string;
  _id?: string;
  status?: UnitStatus;
};

export type SyllabusUnitUpdate = Partial<Pick<SyllabusUnitPayload, "title" | "description" | "estimated_hours">> & {
  status?: UnitStatus;
};

export async function listSyllabusUnits(filters: { academic_year_id?: string; class_id?: string; subject_id?: string }) {
  return unwrapPage<SyllabusUnit>(await apiRequest("/syllabus", { query: filters })).items;
}

export async function getSyllabusUnit(id: string) {
  return unwrap<SyllabusUnit>(await apiRequest(`/syllabus/${encodeURIComponent(id)}`));
}

export function createSyllabusUnit(payload: SyllabusUnitPayload) {
  return apiRequest("/syllabus", { method: "POST", body: payload });
}

export function updateSyllabusUnit(id: string, payload: SyllabusUnitUpdate) {
  return apiRequest(`/syllabus/${encodeURIComponent(id)}`, { method: "PUT", body: payload });
}
