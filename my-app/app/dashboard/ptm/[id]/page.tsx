"use client";

import { use, useState } from "react";
import type { SubmitEvent } from "react";
import { Alert, Field, PageHeader, Select } from "@/components/form";
import { Card, EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { addPtmSlot, listPtmEvents, listPtmSlots, publishPtmEvent, recordPtmOutcome, type PtmBooking } from "@/lib/ptm";
import { useStudentNames } from "@/hooks/use-student-names";
import { listStaff } from "@/lib/staff";
import { fullName, getErrorMessage } from "@/lib/utils";

export default function ParentMeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const events = useQuery("ptm-events", listPtmEvents);
  const slots = useQuery(`ptm-slots:${id}`, () => listPtmSlots(id));
  const teachers = useQuery("ptm-teachers", () => listStaff({ staff_type: "TEACHING", status: "ACTIVE" }));
  const [teacherId, setTeacherId] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [capacity, setCapacity] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [outcome, setOutcome] = useState<{ id: string; attendance: "ATTENDED" | "NO_SHOW"; family: string; notes: string } | null>(null);
  const bookings = (slots.data ?? []).flatMap((slot) => (slot.bookings ?? []).map((b) => ({ ...b, slot })));
  const studentNames = useStudentNames();
  const bookingId = (b: PtmBooking) => b.booking_id ?? b.id ?? b._id ?? "";
  const event = events.data?.find((item) => getId(item) === id);
  const published = event?.published === true || event?.status?.toUpperCase() === "PUBLISHED";

  const add = async (form: SubmitEvent<HTMLFormElement>) => {
    form.preventDefault(); setError(""); setMessage("");
    if (!teacherId || !starts || !ends || new Date(ends) <= new Date(starts)) { setError("Select a teacher and a valid slot time range."); return; }
    setBusy(true);
    try {
      await addPtmSlot(id, { teacher_id: teacherId, starts_at: new Date(starts).toISOString(),
        ends_at: new Date(ends).toISOString(), capacity });
      setStarts(""); setEnds(""); setMessage("Teacher slot added."); slots.reload();
    } catch (err) { setError(getErrorMessage(err, "Could not add slot")); }
    finally { setBusy(false); }
  };

  const publish = async () => {
    if (!window.confirm("Publish this event and allow bookings?")) return;
    setBusy(true); setError(""); setMessage("");
    try { await publishPtmEvent(id); setMessage("Meeting event published."); events.reload(); }
    catch (err) { setError(getErrorMessage(err, "Could not publish event")); }
    finally { setBusy(false); }
  };

  const saveOutcome = async (form: SubmitEvent<HTMLFormElement>) => {
    form.preventDefault();
    if (!outcome) return;
    setBusy(true); setError(""); setMessage("");
    try {
      await recordPtmOutcome(outcome.id, { attendance: outcome.attendance, family_visible_outcome: outcome.family.trim() || null, staff_notes: outcome.notes.trim() || null });
      setOutcome(null); setMessage("Meeting outcome saved."); slots.reload();
    } catch (err) { setError(getErrorMessage(err, "Could not save outcome")); }
    finally { setBusy(false); }
  };

  return <div className="mx-auto max-w-5xl space-y-5">
    <PageHeader title={event?.title ?? "Parent meeting"} description="Teacher slots and publication" backHref="/dashboard/ptm" action={event && !published && <Button disabled={busy || !slots.data?.length} onClick={publish}>Publish event</Button>} />
    {(events.error || slots.error || teachers.error || error) && <Alert type="error">{events.error || slots.error || teachers.error || error}</Alert>}
    {message && <Alert type="success">{message}</Alert>}
    {event && <Card title="Event"><p className="text-sm">{new Date(event.starts_at).toLocaleString()} to {new Date(event.ends_at).toLocaleString()}{event.location ? ` · ${event.location}` : ""}</p></Card>}
    {!published && <Card title="Add teacher slot"><form onSubmit={add} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">
      <Field label="Teacher" htmlFor="slot-teacher" required><Select id="slot-teacher" required value={teacherId} onChange={(e) => setTeacherId(e.target.value)}><option value="">Select teacher</option>{teachers.data?.map((teacher) => <option key={getId(teacher)} value={getId(teacher)}>{fullName(teacher)}</option>)}</Select></Field>
      <Field label="Capacity" htmlFor="slot-capacity" required><Input id="slot-capacity" type="number" min={1} max={100} step={1} required value={capacity} onChange={(e) => setCapacity(Number(e.target.value))} /></Field>
      <Field label="Starts" htmlFor="slot-start" required><Input id="slot-start" type="datetime-local" required value={starts} onChange={(e) => setStarts(e.target.value)} /></Field>
      <Field label="Ends" htmlFor="slot-end" required><Input id="slot-end" type="datetime-local" required min={starts} value={ends} onChange={(e) => setEnds(e.target.value)} /></Field>
    </div><Button type="submit" disabled={busy}>{busy ? "Saving..." : "Add slot"}</Button></form></Card>}
    {slots.loading ? <Loading /> : (slots.data?.length ?? 0) === 0 ? <EmptyState>No slots yet. Add at least one before publishing.</EmptyState> : <Table><THead><tr><TH>Teacher</TH><TH>Starts</TH><TH>Ends</TH><TH>Capacity</TH><TH>Booked</TH></tr></THead><TBody>{slots.data?.map((slot, index) => <tr key={getId(slot) || index}><TD>{teachers.data?.find((teacher) => getId(teacher) === slot.teacher_id) ? fullName(teachers.data!.find((teacher) => getId(teacher) === slot.teacher_id)!) : slot.teacher_id}</TD><TD>{new Date(slot.starts_at).toLocaleString()}</TD><TD>{new Date(slot.ends_at).toLocaleString()}</TD><TD>{slot.capacity ?? 1}</TD><TD>{slot.booked_count ?? slot.bookings?.length ?? "—"}</TD></tr>)}</TBody></Table>}
    {published && bookings.length > 0 && <Card title="Bookings">
      <Table><THead><tr><TH>Student</TH><TH>Slot</TH><TH>Status</TH><TH>Attendance</TH><TH></TH></tr></THead><TBody>{bookings.map((b, index) => { const bid = bookingId(b); return <tr key={bid || index}>
        <TD>{b.student_id ? studentNames.name(b.student_id) : "—"}</TD>
        <TD>{new Date(b.slot.starts_at).toLocaleString()}</TD>
        <TD>{b.status ?? "—"}</TD>
        <TD>{b.attendance === "ATTENDED" ? "Attended" : b.attendance === "NO_SHOW" ? "No show" : "—"}</TD>
        <TD>{bid && <Button size="sm" variant="outline" onClick={() => setOutcome({ id: bid, attendance: b.attendance ?? "ATTENDED", family: b.family_visible_outcome ?? "", notes: b.staff_notes ?? "" })}>Record outcome</Button>}</TD>
      </tr>; })}</TBody></Table>
      {outcome && <form onSubmit={saveOutcome} className="mt-4 space-y-4 rounded-md border bg-muted/30 p-3">
        <Field label="Attendance" htmlFor="ptm-attendance" required><Select id="ptm-attendance" value={outcome.attendance} onChange={(e) => setOutcome({ ...outcome, attendance: e.target.value as "ATTENDED" | "NO_SHOW" })}><option value="ATTENDED">Attended</option><option value="NO_SHOW">No show</option></Select></Field>
        <Field label="Summary for the family" htmlFor="ptm-family" hint="Parents can see this."><textarea id="ptm-family" rows={2} maxLength={1000} value={outcome.family} onChange={(e) => setOutcome({ ...outcome, family: e.target.value })} className="w-full rounded-md border border-input bg-transparent p-3 text-sm" /></Field>
        <Field label="Staff notes" htmlFor="ptm-notes" hint="Only staff can see this."><textarea id="ptm-notes" rows={3} maxLength={4000} value={outcome.notes} onChange={(e) => setOutcome({ ...outcome, notes: e.target.value })} className="w-full rounded-md border border-input bg-transparent p-3 text-sm" /></Field>
        <div className="flex gap-2"><Button type="submit" disabled={busy}>Save outcome</Button><Button type="button" variant="outline" onClick={() => setOutcome(null)}>Cancel</Button></div>
      </form>}
    </Card>}
  </div>;
}
