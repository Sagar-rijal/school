import { apiRequest, unwrap, unwrapPage } from "./api";

const BASE = "/api/v1/school-backend";

export const MATERIAL_TYPES = ["DOCUMENT", "VIDEO", "AUDIO", "LINK", "SLIDES", "BOOK"] as const;
export const MATERIAL_STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;
export type MaterialType = (typeof MATERIAL_TYPES)[number];
export type MaterialStatus = (typeof MATERIAL_STATUSES)[number];

export type MaterialPayload = {
  title: string;
  description?: string;
  material_type?: MaterialType;
  academic_year_id?: string | null;
  class_id?: string | null;
  section_id?: string | null;
  subject_id?: string | null;
  file_url?: string | null;
  file_id?: string | null;
  author?: string | null;
  publisher?: string | null;
  isbn?: string | null;
  language?: string | null;
  tags?: string[];
};

export type StudyMaterial = MaterialPayload & {
  id?: string;
  _id?: string;
  status?: MaterialStatus;
  revision?: number;
  created_at?: string;
};

export type MaterialVersion = { id?: string; _id?: string; version?: number; file_id?: string; file_url?: string; created_at?: string; reason?: string };

export async function listMaterials(filters: { academic_year_id?: string; class_id?: string; section_id?: string; subject_id?: string; material_type?: MaterialType; status?: MaterialStatus; after?: string } = {}) {
  return unwrapPage<StudyMaterial>(await apiRequest("/materials", { query: { ...filters, limit: 50 } }));
}

export async function getMaterial(id: string) {
  return unwrap<StudyMaterial>(await apiRequest(`/materials/${encodeURIComponent(id)}`));
}

export function createMaterial(payload: MaterialPayload) {
  return apiRequest("/materials", { method: "POST", body: payload });
}

export function transitionMaterial(id: string, action: "publish" | "archive", expectedRevision: number) {
  return apiRequest(`/materials/${encodeURIComponent(id)}/${action}`, { method: "POST", body: { expected_revision: expectedRevision } });
}

export async function listMaterialVersions(id: string) {
  return unwrapPage<MaterialVersion>(await apiRequest(`/materials/${encodeURIComponent(id)}/versions`, { query: { limit: 50 } }));
}

export async function getMaterialVersion(id: string, versionId: string) {
  return unwrap<MaterialVersion>(await apiRequest(`/materials/${encodeURIComponent(id)}/versions/${encodeURIComponent(versionId)}`));
}

/** Link for <a href>; the proxy attaches the session. Omit versionId for the current file. */
export function materialDownloadUrl(id: string, versionId?: string) {
  const qs = versionId ? `?version_id=${encodeURIComponent(versionId)}` : "";
  return `${BASE}/materials/${encodeURIComponent(id)}/download${qs}`;
}

/** Swaps in a newly uploaded file and records a new version. */
export function replaceMaterialFile(id: string, payload: { file_id: string; expected_revision: number; reason: string }) {
  return apiRequest(`/materials/${encodeURIComponent(id)}/replace`, { method: "POST", body: payload });
}

export function deleteMaterial(id: string) {
  return apiRequest(`/materials/${encodeURIComponent(id)}`, { method: "DELETE" });
}
