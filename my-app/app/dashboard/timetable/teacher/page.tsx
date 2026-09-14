"use client";

import { use } from "react";
import Link from "next/link";
import { Alert, PageHeader, Select } from "@/components/form";
import { EmptyState, Loading } from "@/components/data-display";
import AcademicYearSelect from "@/components/academic-years/academic-year-select";
import WeeklyGrid from "@/components/timetable/weekly-grid";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { getId } from "@/lib/api";
import { listStaff } from "@/lib/staff";
import { getTeacherWeeklySchedule, listPeriods } from "@/lib/timetable";
import { fullName } from "@/lib/utils";

type Filters = { year?: string; staff?: string };

export default function TeacherSchedulePage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = use(searchParams);
  const setFilters = useUrlFilters("/dashboard/timetable/teacher", filters);
  const { years, defaultYearId } = useAcademicYears();
  const lookup = useAcademicLookup();
  const year = filters.year || defaultYearId;

  const teachers = useQuery("staff:teaching", () => listStaff({ staff_type: "TEACHING" }));
  const periods = useQuery(year ? `periods:${year}` : null, () => listPeriods(year));
  const schedule = useQuery(year && filters.staff ? `teacher-schedule:${year}:${filters.staff}` : null, () =>
    getTeacherWeeklySchedule(filters.staff!, year)
  );

  const teacher = teachers.data?.find((t) => getId(t) === filters.staff);
  const entries = schedule.data ?? [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Teacher schedule"
        description={teacher ? `${fullName(teacher)} · ${entries.length} class${entries.length === 1 ? "" : "es"} a week` : "A teacher's classes across the week"}
        action={teacher && <Link href={`/dashboard/staff/${filters.staff}`} className="text-sm underline">Staff profile</Link>}
      />

      <div className="flex flex-wrap gap-2">
        <AcademicYearSelect years={years} value={year} onChange={(y) => setFilters({ year: y })} className="w-auto min-w-36" />
        <Select aria-label="Teacher" value={filters.staff ?? ""} onChange={(e) => setFilters({ staff: e.target.value })} className="w-auto min-w-56">
          <option value="">{teachers.loading ? "Loading teachers..." : "Select teacher"}</option>
          {[...(teachers.data ?? [])].sort((a, b) => fullName(a).localeCompare(fullName(b))).map((t) => (
            <option key={getId(t)} value={getId(t)}>{fullName(t)}</option>
          ))}
        </Select>
      </div>

      {(schedule.error || periods.error) && <Alert type="error">{schedule.error || periods.error}</Alert>}

      {!filters.staff ? (
        <EmptyState>Select a teacher to see their week.</EmptyState>
      ) : schedule.loading || periods.loading || lookup.loading ? (
        <Loading />
      ) : (periods.data ?? []).length === 0 ? (
        <EmptyState>No periods are defined for this academic year.</EmptyState>
      ) : entries.length === 0 ? (
        <EmptyState>No classes scheduled for this teacher.</EmptyState>
      ) : (
        <WeeklyGrid
          periods={periods.data!}
          entries={entries}
          renderEntry={(e) => (
            <>
              <span className="font-medium leading-tight">
                {lookup.className(e.class_id)} {lookup.sectionName(e.section_id)}
              </span>
              <span className="text-xs text-muted-foreground">{e.subject_id ? lookup.subjectName(e.subject_id) : ""}</span>
              {e.room && <span className="text-xs text-muted-foreground">Room {e.room}</span>}
            </>
          )}
        />
      )}
    </div>
  );
}
