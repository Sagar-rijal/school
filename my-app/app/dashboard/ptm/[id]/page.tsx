"use client";

import { use, useState } from "react";
import type { SubmitEvent } from "react";
import { Alert, Field, PageHeader, Select } from "@/components/form";
import { Card, EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { addPtmSlot, listPtmEvents, listPtmSlots, publishPtmEvent } from "@/lib/ptm";
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
    {slots.loading ? <Loading /> : (slots.data?.length ?? 0) === 0 ? <EmptyState>No slots yet. Add at least one before publishing.</EmptyState> : <Table><THead><tr><TH>Teacher</TH><TH>Starts</TH><TH>Ends</TH><TH>Capacity</TH><TH>Booked</TH></tr></THead><TBody>{slots.data?.map((slot, index) => <tr key={getId(slot) || index}><TD>{teachers.data?.find((teacher) => getId(teacher) === slot.teacher_id) ? fullName(teachers.data!.find((teacher) => getId(teacher) === slot.teacher_id)!) : slot.teacher_id}</TD><TD>{new Date(slot.starts_at).toLocaleString()}</TD><TD>{new Date(slot.ends_at).toLocaleString()}</TD><TD>{slot.capacity ?? 1}</TD><TD>{slot.booked_count ?? "—"}</TD></tr>)}</TBody></Table>}
  </div>;
}
