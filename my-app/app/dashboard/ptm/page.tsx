"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";
import AcademicYearSelect from "@/components/academic-years/academic-year-select";
import { Alert, Field, PageHeader } from "@/components/form";
import { Card, EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { createPtmEvent, listPtmEvents } from "@/lib/ptm";
import { formatEnum, getErrorMessage } from "@/lib/utils";

export default function ParentMeetingsPage() {
  const years = useAcademicYears();
  const [selectedYear, setSelectedYear] = useState("");
  const year = selectedYear || years.defaultYearId;
  const events = useQuery("ptm-events", listPtmEvents);
  const [title, setTitle] = useState("");
  const [location, setLocation] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [opens, setOpens] = useState("");
  const [closes, setCloses] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setMessage("");
    if (!year || !starts || !ends || !opens || !closes || new Date(ends) <= new Date(starts) || new Date(closes) <= new Date(opens)) {
      setError("Select an academic year and valid meeting and booking time ranges."); return;
    }
    setBusy(true);
    try {
      await createPtmEvent({ title: title.trim(), academic_year_id: year, location: location.trim() || null,
        starts_at: new Date(starts).toISOString(), ends_at: new Date(ends).toISOString(),
        booking_opens_at: new Date(opens).toISOString(), booking_closes_at: new Date(closes).toISOString() });
      setTitle(""); setLocation(""); setStarts(""); setEnds(""); setOpens(""); setCloses("");
      setMessage("Meeting event added. Add teacher slots before publishing it."); events.reload();
    } catch (err) { setError(getErrorMessage(err, "Could not add meeting event")); }
    finally { setBusy(false); }
  };

  return <div className="mx-auto max-w-5xl space-y-5">
    <PageHeader title="Parent meetings" description="Create meeting events and teacher appointment slots" />
    {(years.error || events.error || error) && <Alert type="error">{years.error || events.error || error}</Alert>}
    {message && <Alert type="success">{message}</Alert>}
    <Card title="Create meeting event"><form onSubmit={submit} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">
      <Field label="Academic year" htmlFor="ptm-year" required><AcademicYearSelect id="ptm-year" years={years.years} value={year} onChange={setSelectedYear} /></Field>
      <Field label="Title" htmlFor="ptm-title" required><Input id="ptm-title" required maxLength={160} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
      <Field label="Meeting starts" htmlFor="ptm-start" required><Input id="ptm-start" type="datetime-local" required value={starts} onChange={(e) => setStarts(e.target.value)} /></Field>
      <Field label="Meeting ends" htmlFor="ptm-end" required><Input id="ptm-end" type="datetime-local" required min={starts} value={ends} onChange={(e) => setEnds(e.target.value)} /></Field>
      <Field label="Booking opens" htmlFor="ptm-opens" required><Input id="ptm-opens" type="datetime-local" required value={opens} onChange={(e) => setOpens(e.target.value)} /></Field>
      <Field label="Booking closes" htmlFor="ptm-closes" required><Input id="ptm-closes" type="datetime-local" required min={opens} value={closes} onChange={(e) => setCloses(e.target.value)} /></Field>
      <Field label="Location" htmlFor="ptm-location"><Input id="ptm-location" maxLength={300} value={location} onChange={(e) => setLocation(e.target.value)} /></Field>
    </div><Button type="submit" disabled={busy || !year}>{busy ? "Saving..." : "Create event"}</Button></form></Card>
    {events.loading ? <Loading /> : (events.data?.length ?? 0) === 0 ? <EmptyState>No meeting events yet.</EmptyState> : <Table><THead><tr><TH>Event</TH><TH>Date</TH><TH>Location</TH><TH>Status</TH><TH>Slots</TH></tr></THead><TBody>{events.data?.map((item, index) => <tr key={getId(item) || index}><TD className="font-medium">{item.title}</TD><TD>{new Date(item.starts_at).toLocaleString()}</TD><TD>{item.location || "—"}</TD><TD>{formatEnum(item.status ?? (item.published ? "PUBLISHED" : "DRAFT"))}</TD><TD>{getId(item) && <Button size="sm" variant="outline" asChild><Link href={`/dashboard/ptm/${getId(item)}`}>Manage</Link></Button>}</TD></tr>)}</TBody></Table>}
  </div>;
}
