import { ApiError, apiRequest, findCreatedId, unwrap, unwrapPage } from "./api";

// Private files: uploaded once, then referenced by id from imports, materials,
// payment proofs, notices etc. Downloads go through the session proxy.

export type StoredFile = {
  id?: string;
  _id?: string;
  file_id?: string;
  filename?: string;
  original_name?: string;
  content_type?: string;
  size?: number;
  size_bytes?: number;
  purpose?: string;
  status?: string;
  created_at?: string;
};

/** Backend path used for <a href> downloads (cookies are attached by the proxy). */
export function fileContentUrl(fileId: string) {
  return `/api/v1/school-backend/files/${encodeURIComponent(fileId)}/content`;
}

/** Uploads raw bytes and returns the new file's id. */
export async function uploadFile(file: File, purpose: string, studentId?: string) {
  const res = await apiRequest("/files", { method: "POST", body: file, query: { purpose, student_id: studentId } });
  const value = unwrap<StoredFile | string>(res);
  const id = (typeof value === "object" && value?.file_id) || findCreatedId(res);
  if (!id) throw new ApiError("The file was uploaded but the server did not return its id.", 502);
  return id;
}

export async function listFiles(after?: string) {
  return unwrapPage<StoredFile>(await apiRequest("/files", { query: { limit: 50, after } }));
}

export async function getFileMetadata(fileId: string) {
  return unwrap<StoredFile>(await apiRequest(`/files/${encodeURIComponent(fileId)}`));
}

/** Attach an uploaded file to a record, e.g. ("material", materialId). */
export function linkFile(fileId: string, entityType: string, entityId: string) {
  return apiRequest(`/files/${encodeURIComponent(fileId)}/link`, {
    method: "POST",
    body: { entity_type: entityType, entity_id: entityId },
  });
}

/** Re-checks a file whose upload or scan didn't finish. */
export function reconcileFile(fileId: string) {
  return apiRequest(`/files/${encodeURIComponent(fileId)}/reconcile`, { method: "POST" });
}

export function formatFileSize(bytes?: number) {
  if (!bytes && bytes !== 0) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
