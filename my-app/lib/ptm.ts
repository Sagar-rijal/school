import { apiRequest, unwrapPage } from "./api";

export type PtmEventPayload = {
  title: string;
  academic_year_id: string;
  starts_at: string;
  ends_at: string;
  booking_opens_at: string;
  booking_closes_at: string;
  location?: string | null;
  class_ids?: string[];
};

export type PtmEvent = PtmEventPayload & { id?: string; _id?: string; status?: string; published?: boolean };
export type PtmSlot = { id?: string; _id?: string; teacher_id: string; starts_at: string; ends_at: string; capacity?: number; booked_count?: number; teacher_name?: string; bookings?: PtmBooking[] };

export async function listPtmEvents() {
  return unwrapPage<PtmEvent>(await apiRequest("/ptm/events")).items;
}

export function createPtmEvent(payload: PtmEventPayload) {
  return apiRequest("/ptm/events", { method: "POST", body: payload });
}

export async function listPtmSlots(eventId: string) {
  return unwrapPage<PtmSlot>(await apiRequest(`/ptm/events/${encodeURIComponent(eventId)}/slots`)).items;
}

export function addPtmSlot(eventId: string, payload: { teacher_id: string; starts_at: string; ends_at: string; capacity: number }) {
  return apiRequest(`/ptm/events/${encodeURIComponent(eventId)}/slots`, { method: "POST", body: payload });
}

export function publishPtmEvent(eventId: string) {
  return apiRequest(`/ptm/events/${encodeURIComponent(eventId)}/publish`, { method: "POST" });
}

// ── Bookings ──

export type PtmBooking = {
  id?: string;
  _id?: string;
  booking_id?: string;
  slot_id?: string;
  event_id?: string;
  teacher_id?: string;
  teacher_name?: string;
  student_id?: string;
  parent_id?: string;
  status?: string;
  attendance?: "ATTENDED" | "NO_SHOW" | null;
  family_visible_outcome?: string | null;
  staff_notes?: string | null;
  starts_at?: string;
  ends_at?: string;
};

export function bookPtmSlot(studentId: string, slotId: string) {
  return apiRequest("/ptm/bookings", { method: "POST", body: { student_id: studentId, slot_id: slotId, idempotency_key: crypto.randomUUID() } });
}

export function cancelPtmBooking(bookingId: string) {
  return apiRequest(`/ptm/bookings/${encodeURIComponent(bookingId)}`, { method: "DELETE" });
}

export function reschedulePtmBooking(bookingId: string, slotId: string) {
  return apiRequest(`/ptm/bookings/${encodeURIComponent(bookingId)}/reschedule`, { method: "POST", body: { slot_id: slotId, idempotency_key: crypto.randomUUID() } });
}

/** scope "family" (default) for parents; staff may pass another scope to see bookings with them. */
export async function listMyPtmBookings(scope = "family") {
  return unwrapPage<PtmBooking>(await apiRequest("/ptm/bookings/mine", { query: { scope } })).items;
}

export function recordPtmOutcome(bookingId: string, payload: { attendance: "ATTENDED" | "NO_SHOW"; family_visible_outcome?: string | null; staff_notes?: string | null }) {
  return apiRequest(`/ptm/bookings/${encodeURIComponent(bookingId)}/outcome`, { method: "PUT", body: payload });
}
