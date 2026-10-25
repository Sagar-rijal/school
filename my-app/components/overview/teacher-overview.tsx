"use client";

import Link from "next/link";
import { useSession } from "@/components/session-provider";
import { Alert, PageHeader } from "@/components/form";
import { Card, EmptyState, Loading, StatTile } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useQuery } from "@/hooks/use-query";
import { listAssignmentsByTeacher } from "@/lib/academic";
import { hasPermission } from "@/lib/access";
import { getMyPublishedSchedule } from "@/lib/teacher";
import { todayInput } from "@/lib/utils";

export default function TeacherOverview() {
  const session = useSession();
  const lookup = useAcademicLookup();
  const today = todayInput();
  const assignments = useQuery(session?.id ? `teacher-assignments:${session.id}` : null,
    () => listAssignmentsByTeacher(session!.id));
  const schedule = useQuery(`teacher-schedule:${today}`, () => getMyPublishedSchedule(today, today));
  const uniqueClasses = new Set((assignments.data ?? []).map((item) => `${item.class_id}:${item.section_id}`));
  const label = (value: string, id: string) => value === "—" ? id : value;

  return <div className="mx-auto max-w-6xl space-y-6">
    <PageHeader title="My teaching" description={session?.email ? `Welcome, ${session.email}` : "Your classes and today's schedule"} />
    {(assignments.error || schedule.error) && <Alert type="error">{assignments.error || schedule.error}</Alert>}
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <StatTile label="Assigned class sections" value={assignments.loading ? "…" : uniqueClasses.size} />
      <StatTile label="Lessons today" value={schedule.loading ? "…" : (schedule.data ?? []).length} />
      <StatTile label="Today" value={new Date(`${today}T12:00:00`).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })} />
    </div>
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <Card title="My classes" action={<Button variant="outline" size="sm" asChild><Link href="/dashboard/teacher/classes">All classes</Link></Button>}>
        {assignments.loading || lookup.loading ? <Loading /> : (assignments.data?.length ?? 0) === 0 ? <EmptyState>No classes assigned yet. Ask the principal to assign your classes.</EmptyState> :
          <ul className="divide-y rounded-md border">{assignments.data?.slice(0, 5).map((item, index) =>
            <li key={item.id ?? item._id ?? index} className="p-3 text-sm"><span className="font-medium">{label(lookup.className(item.class_id), item.class_id)} · Section {label(lookup.sectionName(item.section_id), item.section_id)}</span><p className="text-muted-foreground">{item.subject_id ? label(lookup.subjectName(item.subject_id), item.subject_id) : "Class teacher"}</p></li>)}</ul>}
      </Card>
      <Card title="Today's published schedule" action={<Button variant="outline" size="sm" asChild><Link href="/dashboard/teacher/schedule">Full week</Link></Button>}>
        {schedule.loading ? <Loading /> : (schedule.data?.length ?? 0) === 0 ? <EmptyState>No published lessons for today.</EmptyState> :
          <ul className="divide-y rounded-md border">{schedule.data?.map((item, index) => <li key={index} className="flex flex-wrap justify-between gap-2 p-3 text-sm"><div><span className="font-medium">{item.subject_id ? label(lookup.subjectName(item.subject_id), item.subject_id) : item.title || item.slot_type || "Lesson"}</span><p className="text-muted-foreground">{item.class_id ? label(lookup.className(item.class_id), item.class_id) : ""}{item.section_id ? ` · ${label(lookup.sectionName(item.section_id), item.section_id)}` : ""}</p></div><span className="text-muted-foreground">{item.start_time && item.end_time ? `${item.start_time}–${item.end_time}` : item.period_number ? `Period ${item.period_number}` : ""}</span></li>)}</ul>}
      </Card>
    </div>
    <div className="flex flex-wrap gap-2">
      {session && hasPermission(session, "attendance:mark") && <Button variant="outline" asChild><Link href="/dashboard/attendance">Take attendance</Link></Button>}
      {session && hasPermission(session, "homework:manage") && <Button variant="outline" asChild><Link href="/dashboard/homework">Assign homework</Link></Button>}
      {session && hasPermission(session, "exam:marks_entry") && <Button variant="outline" asChild><Link href="/dashboard/teacher/exams">Enter marks</Link></Button>}
    </div>
  </div>;
}
