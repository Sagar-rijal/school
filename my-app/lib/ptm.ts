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
export type PtmSlot = { id?: string; _id?: string; teacher_id: string; starts_at: string; ends_at: string; capacity?: number; booked_count?: number };

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
