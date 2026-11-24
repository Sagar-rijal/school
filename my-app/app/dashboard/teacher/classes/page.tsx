"use client";

import Link from "next/link";
import { PageHeader, Alert } from "@/components/form";
import { EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useTeacherAssignments } from "@/hooks/use-teacher-assignments";

export default function TeacherClassesPage() {
  const { assignments, loading, error } = useTeacherAssignments();
  const lookup = useAcademicLookup();
  const label = (name: string, id: string) => name === "—" ? id : name;
  return <div className="mx-auto max-w-5xl space-y-5">
    <PageHeader title="My classes" description="Class sections and subjects assigned to you" backHref="/dashboard/teacher" />
    {error && <Alert type="error">{error}</Alert>}
    {loading ? <Loading /> : assignments.length === 0 ? <EmptyState>No teaching assignments yet. Ask the principal to assign a class and subject.</EmptyState> :
      <Table><THead><tr><TH>Class</TH><TH>Section</TH><TH>Subject</TH><TH>Actions</TH></tr></THead><TBody>{assignments.map((item, index) => {
        const filters = new URLSearchParams({ year: item.academic_year_id, class: item.class_id, section: item.section_id });
        return <tr key={item.id ?? item._id ?? index}><TD>{label(lookup.className(item.class_id), item.class_id)}</TD><TD>{label(lookup.sectionName(item.section_id), item.section_id)}</TD><TD>{item.subject_id ? label(lookup.subjectName(item.subject_id), item.subject_id) : "Class teacher"}</TD><TD><Button variant="outline" size="sm" asChild><Link href={`/dashboard/attendance?${filters}`}>Attendance</Link></Button></TD></tr>;
      })}</TBody></Table>}
  </div>;
}
