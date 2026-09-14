"use client";

import { use, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, PageHeader, Select } from "@/components/form";
import { EmptyState, Loading, StatusBadge, Table, TBody, TD, TH, THead } from "@/components/data-display";
import ClassSectionPicker from "@/components/class-section-picker";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { getId } from "@/lib/api";
import { getRoster, listStudents } from "@/lib/students";
import { STUDENT_STATUS_TONES, STUDENT_STATUSES, type RosterEntry } from "@/lib/types/student";
import { formatDate, formatEnum, fullName } from "@/lib/utils";

type Filters = { year?: string; class?: string; section?: string; status?: string };

export default function StudentsPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = use(searchParams);
  const setFilters = useUrlFilters("/dashboard/students", filters);
  const { years, defaultYearId } = useAcademicYears();
  const [search, setSearch] = useState("");

  const year = filters.year || defaultYearId;

  // With a class selected, use the roster (adds roll numbers); otherwise list all students
  const students = useQuery(
    `students:${year}:${filters.class}:${filters.section}:${filters.status}`,
    async (): Promise<RosterEntry[]> => {
      if (filters.class && year) {
        const roster = await getRoster(year, filters.class, filters.section);
        return filters.status ? roster.filter((r) => (r.student.status ?? "ACTIVE") === filters.status) : roster;
      }
      const all = await listStudents({ status: filters.status });
      return all
        .map((student) => ({ studentId: getId(student), student, rollNumber: null }))
        .sort((a, b) => fullName(a.student).localeCompare(fullName(b.student)));
    }
  );

  const query = search.trim().toLowerCase();
  const rows = (students.data ?? []).filter(
    ({ student }) =>
      !query ||
      fullName(student).toLowerCase().includes(query) ||
      student.admission_number?.toLowerCase().includes(query)
  );
  const showRoll = rows.some((r) => r.rollNumber);

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Students"
        description="Pick a class to see its roster, or browse all students"
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/parents">Parents</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/students/new">+ Add student</Link>
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <ClassSectionPicker
          years={years}
          value={{ year, class: filters.class ?? "", section: filters.section ?? "" }}
          onChange={(v) => setFilters({ year: v.year, class: v.class, section: v.section })}
          classPlaceholder="All classes"
          sectionPlaceholder="All sections"
        />
        <Select aria-label="Status" value={filters.status ?? ""} onChange={(e) => setFilters({ status: e.target.value })} className="w-auto min-w-32">
          <option value="">Any status</option>
          {STUDENT_STATUSES.map((s) => <option key={s} value={s}>{formatEnum(s)}</option>)}
        </Select>
        <Input
          type="search"
          aria-label="Search students"
          placeholder="Search name or admission no."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64"
        />
      </div>

      {students.error && <div className="mb-4"><Alert type="error">{students.error}</Alert></div>}

      {students.loading ? (
        <Loading>Loading students...</Loading>
      ) : rows.length === 0 ? (
        <EmptyState>{query ? "No students match your search." : "No students found."}</EmptyState>
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                {showRoll && <TH>Roll</TH>}
                <TH>Name</TH>
                <TH>Admission no.</TH>
                <TH>Gender</TH>
                <TH>Date of birth</TH>
                <TH>Phone</TH>
                <TH>Status</TH>
                <TH />
              </tr>
            </THead>
            <TBody>
              {rows.map(({ studentId, student, rollNumber }) => (
                <tr key={studentId} className="hover:bg-muted/30">
                  {showRoll && <TD className="font-mono">{rollNumber ?? "—"}</TD>}
                  <TD className="font-medium">{fullName(student) || "—"}</TD>
                  <TD className="font-mono text-xs">{student.admission_number}</TD>
                  <TD>{student.gender ? formatEnum(student.gender) : "—"}</TD>
                  <TD>{formatDate(student.date_of_birth)}</TD>
                  <TD>{student.phone || "—"}</TD>
                  <TD><StatusBadge value={student.status ?? "ACTIVE"} tones={STUDENT_STATUS_TONES} /></TD>
                  <TD className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/dashboard/students/${studentId}`}>Open</Link>
                    </Button>
                  </TD>
                </tr>
              ))}
            </TBody>
          </Table>
          <p className="mt-2 text-right text-xs text-muted-foreground">{rows.length} student{rows.length === 1 ? "" : "s"}</p>
        </>
      )}
    </div>
  );
}
