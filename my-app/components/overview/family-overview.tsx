"use client";

import Link from "next/link";
import FamilyPage, { type FamilyContext } from "@/components/family/family-page";
import { Card, EmptyState, Loading, StatTile } from "@/components/data-display";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { todayDay } from "@/lib/day";
import { invoiceAmounts, listStudentInvoices } from "@/lib/fees";
import { listHomework } from "@/lib/homework";
import { getUnreadNoticeCount } from "@/lib/notices";
import { getLinkedStudentSchedule, getMyStudentSchedule } from "@/lib/timetable";
import type { TimetableEntry } from "@/lib/types/timetable";
import { formatCurrency, formatDate, todayInput } from "@/lib/utils";

function inDays(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function Home({ child, isStudent, isParent }: FamilyContext) {
  const lookup = useAcademicLookup();
  const e = child.enrollment;
  const today = todayInput();
  const schedule = useQuery(`family-today:${child.studentId}`, () =>
    (isStudent ? getMyStudentSchedule() : getLinkedStudentSchedule(child.studentId)).catch(() => null));
  const homework = useQuery(e ? `family-homework:${e.class_id}:${e.section_id}` : null, () => listHomework({ class_id: e!.class_id, section_id: e!.section_id }));
  const invoices = useQuery(`student-invoices:${child.studentId}`, () => listStudentInvoices(child.studentId).catch(() => []));
  const unread = useQuery(`family-unread:${child.studentId}`, () => getUnreadNoticeCount(isParent ? child.studentId : undefined).catch(() => 0));

  const todaysClasses = (schedule.data?.entries ?? [])
    .filter((x) => x.day_of_week === todayDay())
    .sort((a, b) => a.period_number - b.period_number);
  const dueSoon = (homework.data ?? [])
    .filter((h) => h.due_date.slice(0, 10) >= today && h.due_date.slice(0, 10) <= inDays(7))
    .sort((a, b) => a.due_date.localeCompare(b.due_date));
  const balance = (invoices.data ?? []).reduce((sum, inv) => sum + invoiceAmounts(inv).balance, 0);
  const subject = (x: TimetableEntry) => (x as TimetableEntry & { subject_name?: string }).subject_name ?? (x.subject_id ? lookup.subjectName(x.subject_id) : x.slot_type);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <Link href="/dashboard/family/timetable"><StatTile label="Classes today" value={schedule.loading ? "…" : todaysClasses.length} /></Link>
        <Link href="/dashboard/family/homework"><StatTile label="Homework due this week" value={homework.loading ? "…" : dueSoon.length} /></Link>
        <Link href="/dashboard/family/fees"><StatTile label="Fees due" value={invoices.loading ? "…" : formatCurrency(balance)} tone={balance > 0 ? "red" : "green"} /></Link>
        <Link href="/dashboard/family/notices"><StatTile label="Unread notices" value={unread.loading ? "…" : unread.data ?? 0} /></Link>
      </div>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card title="Today" action={<Link href="/dashboard/family/timetable" className="text-sm text-primary hover:underline">Full timetable</Link>}>
          {schedule.loading ? <Loading /> : todaysClasses.length === 0 ? <EmptyState>No classes today.</EmptyState> : (
            <ul className="divide-y rounded-md border text-sm">
              {todaysClasses.map((x) => (
                <li key={`${x.period_number}`} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span><span className="mr-2 tabular-nums text-muted-foreground">P{x.period_number}</span><span className="font-medium">{subject(x)}</span></span>
                  {x.room && <span className="text-xs text-muted-foreground">Room {x.room}</span>}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Homework due soon" action={<Link href="/dashboard/family/homework" className="text-sm text-primary hover:underline">All homework</Link>}>
          {!e ? <EmptyState>Not enrolled in a class yet.</EmptyState> : homework.loading ? <Loading /> : dueSoon.length === 0 ? <EmptyState>Nothing due this week.</EmptyState> : (
            <ul className="divide-y rounded-md border text-sm">
              {dueSoon.slice(0, 5).map((h) => (
                <li key={getId(h)} className="flex items-center justify-between gap-2 px-3 py-2">
                  <span><span className="font-medium">{h.title}</span><span className="block text-xs text-muted-foreground">{lookup.subjectName(h.subject_id)}</span></span>
                  <span className="text-xs text-muted-foreground">Due {formatDate(h.due_date)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}

export default function FamilyOverview() {
  return <FamilyPage title="Home" description="Your day at a glance">{(ctx) => <Home {...ctx} />}</FamilyPage>;
}
