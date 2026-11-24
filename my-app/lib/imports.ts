import { ApiError, apiRequest, unwrap } from "./api";
import { uploadFile } from "./files";

export const IMPORT_KINDS = ["students", "staff", "enrollments"] as const;
export type ImportKind = (typeof IMPORT_KINDS)[number];

export type ImportJob = {
  id?: string;
  _id?: string;
  import_id?: string;
  kind?: ImportKind;
  status?: string;
  preview_hash?: string;
  total_rows?: number;
  valid_rows?: number;
  invalid_rows?: number;
  error_count?: number;
  committed_rows?: number;
  created_at?: string;
  [key: string]: unknown;
};

export type ImportRow = {
  row_number?: number;
  row?: number;
  status?: string;
  data?: Record<string, unknown>;
  values?: Record<string, unknown>;
  errors?: (string | { field?: string; message?: string; msg?: string })[];
  [key: string]: unknown;
};

const BASE = "/api/v1/school-backend/imports";

/** Links for <a download> (the proxy attaches the session). */
export const importTemplateUrl = (kind: ImportKind) => `${BASE}/templates/${kind}`;
export const importErrorsUrl = (importId: string) => `${BASE}/${encodeURIComponent(importId)}/errors.csv`;

export function importId(job: ImportJob) {
  return job.import_id ?? job.id ?? job._id ?? "";
}

/** Uploads the CSV, then asks the backend to validate it. Nothing is saved until commit. */
export async function previewImport(file: File, kind: ImportKind, provisionLogins: boolean) {
  const fileId = await uploadFile(file, "import");
  const res = await apiRequest("/imports/preview", {
    method: "POST",
    body: { file_id: fileId, kind, provision_logins: provisionLogins },
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });
  const job = unwrap<ImportJob>(res);
  if (!job || !importId(job)) throw new ApiError("The server did not return an import id.", 502);
  return job;
}

export async function getImport(id: string) {
  return unwrap<ImportJob>(await apiRequest(`/imports/${encodeURIComponent(id)}`));
}

export async function listImportRows(id: string, after = 0) {
  const value = unwrap<unknown>(await apiRequest(`/imports/${encodeURIComponent(id)}/rows`, { query: { limit: 100, after } }));
  if (Array.isArray(value)) return { items: value as ImportRow[], next: value.length === 100 ? after + 100 : null };
  const page = (value ?? {}) as { items?: ImportRow[]; rows?: ImportRow[]; next_after?: number | null };
  const items = page.items ?? page.rows ?? [];
  return { items, next: typeof page.next_after === "number" ? page.next_after : null };
}

/** The hash proves the commit matches what was previewed. */
export function commitImport(id: string, previewHash: string) {
  return apiRequest(`/imports/${encodeURIComponent(id)}/commit`, { method: "POST", body: { preview_hash: previewHash } });
}

export function retryImport(id: string, previewHash: string) {
  return apiRequest(`/imports/${encodeURIComponent(id)}/retry`, { method: "POST", body: { preview_hash: previewHash } });
}
