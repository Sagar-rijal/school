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

export type InboxNotice = {
  id?: string;
  _id?: string;
  notification_id?: string;
  title?: string;
  message?: string;
  importance?: Importance;
  created_at?: string;
  sent_at?: string;
  read_at?: string | null;
  is_read?: boolean;
  notification?: { title?: string; message?: string; importance?: Importance; blocks?: { kind: string; text: string }[]; attachment_ids?: string[] };
  blocks?: { kind: string; text: string }[];
  attachment_ids?: string[];
};

export async function listInboxNotices(after?: string, options: { childId?: string; unread?: boolean; importance?: Importance } = {}) {
  return unwrapPage<InboxNotice>(await apiRequest("/notifications/inbox", {
    query: { limit: 50, after, child_id: options.childId, unread: options.unread, importance: options.importance },
  }));
}

export function markNoticeRead(notificationId: string) {
  return apiRequest(`/notifications/${encodeURIComponent(notificationId)}/read`, { method: "PUT" });
}

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

// ── Rich notices (sections, attachments, action buttons) ──

export type NoticeBlock = { kind: "PARAGRAPH" | "HEADING" | "BULLET"; text: string };
export type NoticeAction = { label: string; kind: "MATERIAL" | "INVOICE" | "TIMETABLE"; target_id: string };

export type CompleteNoticePayload = TextNoticePayload & {
  blocks: NoticeBlock[];
  attachment_ids?: string[];
  actions?: NoticeAction[];
};

export function createCompleteNotice(payload: CompleteNoticePayload) {
  return apiRequest("/notifications/complete", { method: "POST", body: payload, headers: { "Idempotency-Key": crypto.randomUUID() } });
}

/** Number of unread inbox notices for the signed-in user (or a parent's child). */
export async function getUnreadNoticeCount(childId?: string) {
  const value = unwrap<unknown>(await apiRequest("/notifications/unread-count", { query: { child_id: childId } }));
  if (typeof value === "number") return value;
  const obj = (value ?? {}) as { count?: number; unread?: number; unread_count?: number };
  return obj.unread_count ?? obj.count ?? obj.unread ?? 0;
}

// ── Legacy broadcast feed (kept for older clients; new notices use /notifications/text) ──

export type LegacyNotification = { id?: string; _id?: string; title: string; message: string; target_scope?: string; class_id?: string | null; section_id?: string | null; created_at?: string };

export function createLegacyNotification(payload: { title: string; message: string; target_scope?: "ALL" | "STUDENTS" | "TEACHERS" | "PARENTS" | "CLASS"; class_id?: string | null; section_id?: string | null }) {
  return apiRequest("/notifications", { method: "POST", body: payload, headers: { "Idempotency-Key": crypto.randomUUID() } });
}

export async function listLegacyNotifications(classId?: string, after?: string) {
  return unwrapPage<LegacyNotification>(await apiRequest("/notifications", { query: { class_id: classId, limit: 100, after } }));
}
