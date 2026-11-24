"use client";

import { useState } from "react";
import FamilyPage, { type FamilyContext } from "@/components/family/family-page";
import WeeklyGrid from "@/components/timetable/weekly-grid";
import { Alert, Field } from "@/components/form";
import { Card, EmptyState, Loading } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useQuery } from "@/hooks/use-query";
import { ApiError } from "@/lib/api";
import { todayDay } from "@/lib/day";
import { getLinkedStudentSchedule, getMyStudentSchedule, listPeriods } from "@/lib/timetable";
import type { PeriodDefinition, TimetableEntry } from "@/lib/types/timetable";
import { formatDate, todayInput } from "@/lib/utils";

/** Rows for the grid: the school's periods, or ones derived from the schedule if those aren't visible. */
function periodsFor(entries: TimetableEntry[], defined?: PeriodDefinition[]) {
  if (defined?.length) return defined;
  const numbers = [...new Set(entries.map((e) => e.period_number))].sort((a, b) => a - b);
  return numbers.map((n) => {
    const e = entries.find((x) => x.period_number === n) as TimetableEntry & { start_time?: string; end_time?: string; period_name?: string };
    return { period_number: n, name: e?.period_name ?? `Period ${n}`, start_time: e?.start_time ?? "", end_time: e?.end_time ?? "", is_break: false, slot_type: "LECTURE", academic_year_id: "" } as PeriodDefinition;
  });
}

function Schedule({ child, isStudent }: FamilyContext) {
  const lookup = useAcademicLookup();
  const [asOf, setAsOf] = useState(todayInput());
  const [view, setView] = useState<"week" | "today">("week");
  const schedule = useQuery(`family-timetable:${child.studentId}:${asOf}`, () =>
    (isStudent ? getMyStudentSchedule(asOf) : getLinkedStudentSchedule(child.studentId, asOf)).catch((err) => {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    })
  );
  const yearId = child.enrollment?.academic_year_id;
  const periods = useQuery(yearId ? `periods:${yearId}` : null, () => listPeriods(yearId).catch(() => []));
  const entries = schedule.data?.entries ?? [];
  const extra = (e: TimetableEntry) => e as TimetableEntry & { subject_name?: string; teacher_name?: string; status?: string; override?: { action?: string } };

  return (
    <>
      {schedule.error && <Alert type="error">{schedule.error}</Alert>}
      <div className="flex flex-wrap items-end gap-2">
        <Field label="Week of" htmlFor="tt-as-of">
          <Input id="tt-as-of" type="date" value={asOf} onChange={(e) => setAsOf(e.target.value || todayInput())} className="w-auto" />
        </Field>
        <Button variant={view === "week" ? "default" : "outline"} onClick={() => setView("week")}>Week</Button>
        <Button variant={view === "today" ? "default" : "outline"} onClick={() => setView("today")}>Today</Button>
      </div>
      {schedule.loading || periods.loading ? <Loading /> : !schedule.data || entries.length === 0 ? (
        <EmptyState>The timetable hasn&apos;t been published yet.</EmptyState>
      ) : (
        <Card title={schedule.data.effectiveFrom ? `In effect from ${formatDate(schedule.data.effectiveFrom)}` : undefined}>
          <WeeklyGrid
            periods={periodsFor(entries, periods.data)}
            entries={entries}
            days={view === "today" ? [todayDay()] : undefined}
            renderEntry={(e) => {
              const x = extra(e);
              const cancelled = x.status === "CANCELLED" || x.override?.action === "CANCEL";
              return (
                <>
                  <span className={cancelled ? "font-medium leading-tight line-through" : "font-medium leading-tight"}>
                    {x.subject_name ?? (e.subject_id ? lookup.subjectName(e.subject_id) : e.slot_type)}
                  </span>
                  {x.teacher_name && <span className="text-xs text-muted-foreground">{x.teacher_name}</span>}
                  {e.room && <span className="text-xs text-muted-foreground">Room {e.room}</span>}
                  {cancelled && <span className="text-xs font-medium text-red-700">Cancelled</span>}
                  {x.override?.action === "SUBSTITUTE" && <span className="text-xs font-medium text-amber-700">Substitute</span>}
                </>
              );
            }}
          />
        </Card>
      )}
    </>
  );
}

export default function FamilyTimetablePage() {
  return <FamilyPage title="Timetable" description="Your weekly class schedule" maxWidth="max-w-7xl">{(ctx) => <Schedule {...ctx} />}</FamilyPage>;
}
