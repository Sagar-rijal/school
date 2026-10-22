"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import AcademicYearSelect from "@/components/academic-years/academic-year-select";
import { useSession } from "@/components/session-provider";
import { Alert, Field, PageHeader, Select } from "@/components/form";
import { Card, EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { hasPermission } from "@/lib/access";
import { createCalendarEvent, EVENT_TYPES, listCalendarEvents, type EventType } from "@/lib/calendar";
import { formatEnum, getErrorMessage } from "@/lib/utils";

export default function CalendarPage() {
  const session = useSession();
  const years = useAcademicYears();
  const [selectedYear, setSelectedYear] = useState("");
  const year = selectedYear || years.defaultYearId;
  const events = useQuery(year ? `calendar:${year}` : null, () => listCalendarEvents(year));
  const [title, setTitle] = useState("");
  const [type, setType] = useState<EventType>("HOLIDAY");
  const [description, setDescription] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [holiday, setHoliday] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canManage = session ? hasPermission(session, "calendar:manage") : false;

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!year || !starts || !ends || new Date(ends) < new Date(starts)) {
      setError("Select an academic year and valid start and end times.");
      return;
    }
    setBusy(true);
    try {
      await createCalendarEvent({
        academic_year_id: year,
        title: title.trim(),
        event_type: type,
        description: description.trim() || null,
        start_date: new Date(starts).toISOString(),
        end_date: new Date(ends).toISOString(),
        is_holiday: holiday,
      });
      setTitle("");
      setDescription("");
      setStarts("");
      setEnds("");
      setMessage("Calendar event added.");
      events.reload();
    } catch (err) {
      setError(getErrorMessage(err, "Could not add event"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader title="School calendar" description="Events and holidays for an academic year" />
      {(years.error || events.error || error) && <Alert type="error">{years.error || events.error || error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}
      <Field label="Academic year" htmlFor="calendar-year">
        <AcademicYearSelect id="calendar-year" years={years.years} value={year} onChange={setSelectedYear} className="max-w-xs" />
      </Field>
      {canManage && (
        <Card title="Add event">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Title" htmlFor="calendar-title" required><Input id="calendar-title" required value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
              <Field label="Type" htmlFor="calendar-type"><Select id="calendar-type" value={type} onChange={(e) => { const next = e.target.value as EventType; setType(next); setHoliday(next === "HOLIDAY"); }}>{EVENT_TYPES.map((item) => <option key={item} value={item}>{formatEnum(item)}</option>)}</Select></Field>
              <Field label="Starts" htmlFor="calendar-start" required><Input id="calendar-start" type="datetime-local" required value={starts} onChange={(e) => setStarts(e.target.value)} /></Field>
              <Field label="Ends" htmlFor="calendar-end" required><Input id="calendar-end" type="datetime-local" required min={starts} value={ends} onChange={(e) => setEnds(e.target.value)} /></Field>
            </div>
            <Field label="Description" htmlFor="calendar-description"><textarea id="calendar-description" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-md border border-input bg-transparent p-3 text-sm" /></Field>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={holiday} onChange={(e) => setHoliday(e.target.checked)} /> Mark as holiday</label>
            <Button type="submit" disabled={busy || !year}>{busy ? "Saving..." : "Add event"}</Button>
          </form>
        </Card>
      )}
      {years.loading || events.loading ? <Loading /> : !year ? <EmptyState>Create an academic year to add events.</EmptyState> : (events.data?.length ?? 0) === 0 ? <EmptyState>No events for this academic year.</EmptyState> : (
        <Table>
          <THead><tr><TH>Event</TH><TH>Type</TH><TH>Starts</TH><TH>Ends</TH><TH>Holiday</TH></tr></THead>
          <TBody>{events.data?.map((item, index) => <tr key={item.id ?? item._id ?? index}><TD><span className="font-medium">{item.title}</span>{item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}</TD><TD>{formatEnum(item.event_type)}</TD><TD>{new Date(item.start_date).toLocaleString()}</TD><TD>{new Date(item.end_date).toLocaleString()}</TD><TD>{item.is_holiday ? "Yes" : "No"}</TD></tr>)}</TBody>
        </Table>
      )}
    </div>
  );
}
