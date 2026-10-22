import { apiRequest, unwrap, unwrapPage } from "./api";

export const IMPORTANCE_LEVELS = ["NORMAL", "IMPORTANT", "URGENT"] as const;
export type Importance = (typeof IMPORTANCE_LEVELS)[number];

export type NoticeAudience = {
  scope: "SCHOOL" | "CLASS" | "INDIVIDUAL";
  academic_year_id?: string | null;
  class_id?: string | null;
  section_id?: string | null;
  roles?: string[];
  user_ids?: string[];
};

export type TextNoticePayload = {
  title: string;
  message: string;
  audience: NoticeAudience;
  importance: Importance;
  publish: boolean;
  publish_at?: string | null;
  expires_at?: string | null;
};

export type Notice = TextNoticePayload & {
  id?: string;
  _id?: string;
  status?: string;
  created_at?: string;
  sent_at?: string;
};

export async function listSentNotices(after?: string, status?: string) {
  return unwrapPage<Notice>(await apiRequest("/notifications/sent", { query: { limit: 50, after, status } }));
}

export async function getNotice(id: string) {
  return unwrap<Notice>(await apiRequest(`/notifications/${encodeURIComponent(id)}`));
}

export function createTextNotice(payload: TextNoticePayload) {
  return apiRequest("/notifications/text", { method: "POST", body: payload, headers: { "Idempotency-Key": crypto.randomUUID() } });
}

export function publishNotice(id: string, publishAt?: string | null) {
  return apiRequest(`/notifications/${encodeURIComponent(id)}/publish`, { method: "POST", body: { publish_at: publishAt ?? null } });
}

export function archiveNotice(id: string, reason: string) {
  return apiRequest(`/notifications/${encodeURIComponent(id)}/archive`, { method: "POST", body: { reason } });
}
