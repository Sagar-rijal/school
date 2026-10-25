"use client";

import { useState } from "react";
import { PageHeader, Alert } from "@/components/form";
import { EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useQuery } from "@/hooks/use-query";
import { getMyPublishedSchedule } from "@/lib/teacher";
import { todayInput } from "@/lib/utils";

function weekStart(date: string) {
  const day = new Date(`${date}T12:00:00`);
  day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}
function addDays(date: string, amount: number) {
  const day = new Date(`${date}T12:00:00`);
  day.setDate(day.getDate() + amount);
  return `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
}

export default function TeacherSchedulePage() {
  const [start, setStart] = useState(() => weekStart(todayInput()));
  const end = addDays(start, 6);
  const query = useQuery(`teacher-week:${start}:${end}`, () => getMyPublishedSchedule(start, end));
  const lookup = useAcademicLookup();
  return <div className="mx-auto max-w-5xl space-y-5">
    <PageHeader title="My schedule" description="Your published lessons for the week" backHref="/dashboard/teacher" />
    <div className="flex items-center gap-3"><Button size="sm" variant="outline" onClick={() => setStart(addDays(start, -7))}>Previous</Button><span className="text-sm">{start} to {end}</span><Button size="sm" variant="outline" onClick={() => setStart(addDays(start, 7))}>Next</Button></div>
    {query.error && <Alert type="error">{query.error}</Alert>}
    {query.loading ? <Loading /> : !query.data?.length ? <EmptyState>No published lessons for this week.</EmptyState> :
      <Table><THead><tr><TH>Day</TH><TH>Time</TH><TH>Class</TH><TH>Subject</TH><TH>Room</TH></tr></THead><TBody>{query.data.map((item, index) => <tr key={index}><TD>{item.date ?? item.day_of_week ?? "—"}</TD><TD>{item.start_time && item.end_time ? `${item.start_time}–${item.end_time}` : item.period_number ? `Period ${item.period_number}` : "—"}</TD><TD>{item.class_id ? lookup.className(item.class_id) : "—"}{item.section_id ? ` · ${lookup.sectionName(item.section_id)}` : ""}</TD><TD>{item.subject_id ? lookup.subjectName(item.subject_id) : item.title ?? item.slot_type ?? "—"}</TD><TD>{item.room ?? "—"}</TD></tr>)}</TBody></Table>}
  </div>;
}
