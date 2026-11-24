"use client";

import { useState } from "react";
import FamilyPage, { type FamilyContext } from "@/components/family/family-page";
import { Alert } from "@/components/form";
import { Card, EmptyState, Loading, StatusBadge } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { bookPtmSlot, cancelPtmBooking, listMyPtmBookings, listPtmEvents, listPtmSlots, reschedulePtmBooking, type PtmBooking, type PtmEvent, type PtmSlot } from "@/lib/ptm";
import { listStaff } from "@/lib/staff";
import { fullName, getErrorMessage } from "@/lib/utils";

const bookingId = (b: PtmBooking) => b.booking_id ?? getId(b);
const isPublished = (e: PtmEvent) => e.published === true || e.status?.toUpperCase() === "PUBLISHED";
const bookingOpen = (e: PtmEvent, now: number) => {
  return (!e.booking_opens_at || new Date(e.booking_opens_at).getTime() <= now) && (!e.booking_closes_at || now <= new Date(e.booking_closes_at).getTime());
};
const timeRange = (start?: string, end?: string) =>
  start ? `${new Date(start).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}${end ? ` – ${new Date(end).toLocaleTimeString([], { timeStyle: "short" })}` : ""}` : "—";

function Meetings({ child }: FamilyContext) {
  const events = useQuery("family-ptm-events", listPtmEvents);
  const bookings = useQuery("family-ptm-bookings", () => listMyPtmBookings("family"));
  // Teacher names are a nicety; families may not be allowed to list staff
  const staff = useQuery("family-staff", () => listStaff({ staff_type: "TEACHING" }).catch(() => []));
  // Captured once per visit; meeting times don't need second-level accuracy
  const [now] = useState(() => Date.now());
  const [eventId, setEventId] = useState("");
  const [moving, setMoving] = useState<PtmBooking | null>(null);
  const slots = useQuery(eventId ? `ptm-slots:${eventId}` : null, () => listPtmSlots(eventId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const teacherName = (slot: { teacher_id?: string; teacher_name?: string }) => {
    if (slot.teacher_name) return slot.teacher_name;
    const t = staff.data?.find((s) => getId(s) === slot.teacher_id);
    return t ? fullName(t) : "Teacher";
  };
  const upcoming = (events.data ?? []).filter((e) => isPublished(e) && new Date(e.ends_at).getTime() >= now);
  const mine = (bookings.data ?? []).filter((b) => !b.student_id || b.student_id === child.studentId);
  const activeBookings = mine.filter((b) => b.status?.toUpperCase() !== "CANCELLED");

  const run = async (action: () => Promise<unknown>, success: string, fallback: string) => {
    setBusy(true); setError(""); setMessage("");
    try { await action(); setMessage(success); setMoving(null); bookings.reload(); slots.reload(); }
    catch (err) { setError(getErrorMessage(err, fallback)); }
    finally { setBusy(false); }
  };

  const choose = (slot: PtmSlot) => {
    const slotId = getId(slot);
    if (moving) run(() => reschedulePtmBooking(bookingId(moving), slotId), "Meeting moved to the new time.", "Could not reschedule");
    else run(() => bookPtmSlot(child.studentId, slotId), "Meeting booked.", "Could not book this slot");
  };

  const cancel = (b: PtmBooking) => {
    if (!window.confirm("Cancel this meeting?")) return;
    run(() => cancelPtmBooking(bookingId(b)), "Meeting cancelled.", "Could not cancel");
  };

  return (
    <>
      {(error || events.error || bookings.error || slots.error) && <Alert type="error">{error || events.error || bookings.error || slots.error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      <Card title="My meetings">
        {bookings.loading ? <Loading /> : mine.length === 0 ? <EmptyState>No meetings booked.</EmptyState> : (
          <ul className="divide-y rounded-md border text-sm">
            {mine.map((b, i) => {
              const cancelled = b.status?.toUpperCase() === "CANCELLED";
              const past = !!b.ends_at && new Date(b.ends_at).getTime() < now;
              return (
                <li key={bookingId(b) || i} className="space-y-1 px-3 py-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span><span className="font-medium">{timeRange(b.starts_at, b.ends_at)}</span><span className="text-muted-foreground"> · {teacherName(b)}</span></span>
                    <span className="flex items-center gap-2">
                      <StatusBadge value={b.attendance ?? b.status ?? "BOOKED"} tones={{ BOOKED: "blue", CONFIRMED: "blue", CANCELLED: "gray", ATTENDED: "green", NO_SHOW: "red" }} />
                      {!cancelled && !past && !b.attendance && (
                        <>
                          <Button size="sm" variant="outline" disabled={busy} onClick={() => { setMoving(b); if (b.event_id) setEventId(b.event_id); }}>Reschedule</Button>
                          <Button size="sm" variant="outline" disabled={busy} className="text-red-600 hover:text-red-700" onClick={() => cancel(b)}>Cancel</Button>
                        </>
                      )}
                    </span>
                  </div>
                  {b.family_visible_outcome && <p className="text-muted-foreground">Teacher&apos;s note: {b.family_visible_outcome}</p>}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card title={moving ? "Pick a new time" : "Book a meeting"} action={moving && <Button size="sm" variant="outline" onClick={() => setMoving(null)}>Stop rescheduling</Button>}>
        <div className="space-y-4">
          {events.loading ? <Loading /> : upcoming.length === 0 ? <EmptyState>No parent-teacher meetings are scheduled right now.</EmptyState> : (
            <div className="flex flex-wrap gap-2">
              {upcoming.map((e) => (
                <Button key={getId(e)} variant={eventId === getId(e) ? "default" : "outline"} onClick={() => setEventId(getId(e))}>
                  {e.title} · {new Date(e.starts_at).toLocaleDateString()}
                </Button>
              ))}
            </div>
          )}
          {eventId && (() => {
            const event = upcoming.find((e) => getId(e) === eventId);
            if (event && !bookingOpen(event, now)) {
              return <EmptyState>Booking is {new Date(event.booking_opens_at).getTime() > now ? `opens ${new Date(event.booking_opens_at).toLocaleString()}` : "closed"} for this meeting.</EmptyState>;
            }
            if (slots.loading) return <Loading />;
            if ((slots.data?.length ?? 0) === 0) return <EmptyState>No time slots available.</EmptyState>;
            return (
              <ul className="grid gap-2 sm:grid-cols-2">
                {slots.data!.map((slot) => {
                  const full = slot.capacity != null && slot.booked_count != null && slot.booked_count >= slot.capacity;
                  const alreadyMine = activeBookings.some((b) => b.slot_id === getId(slot));
                  return (
                    <li key={getId(slot)} className="flex items-center justify-between gap-2 rounded-md border p-3 text-sm">
                      <span><span className="font-medium">{timeRange(slot.starts_at, slot.ends_at)}</span><span className="block text-muted-foreground">{teacherName(slot)}</span></span>
                      {alreadyMine ? <span className="text-xs text-muted-foreground">Booked</span> : (
                        <Button size="sm" disabled={busy || full} onClick={() => choose(slot)}>{full ? "Full" : moving ? "Move here" : "Book"}</Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            );
          })()}
        </div>
      </Card>
    </>
  );
}

export default function FamilyMeetingsPage() {
  return <FamilyPage title="Parent meetings" description="Book time with your teachers">{(ctx) => <Meetings {...ctx} />}</FamilyPage>;
}
