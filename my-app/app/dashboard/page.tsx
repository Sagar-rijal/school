"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, PageHeader } from "@/components/form";
import { Card, EmptyState, Loading, StatTile } from "@/components/data-display";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { listClasses } from "@/lib/academic";
import { getId } from "@/lib/api";
import { listExamSchedules } from "@/lib/exams";
import { invoiceAmounts, listInvoices } from "@/lib/fees";
import { listStaff } from "@/lib/staff";
import { listStudents } from "@/lib/students";
import { formatCurrency, formatDate, formatEnum, todayInput } from "@/lib/utils";

const QUICK_LINKS = [
  { href: "/dashboard/attendance", label: "Mark attendance" },
  { href: "/dashboard/students/new", label: "Add student" },
  { href: "/dashboard/fees/invoices/new", label: "Generate invoices" },
  { href: "/dashboard/exams/schedules/new", label: "Schedule exam" },
];

export default function DashboardOverviewPage() {
  const { years, defaultYearId, loading: yearsLoading, error: yearsError } = useAcademicYears();
  const year = defaultYearId;
  const currentYear = years.find((y) => getId(y) === year);

  const students = useQuery("overview:students", () => listStudents());
  const staff = useQuery("overview:staff", () => listStaff());
  const classes = useQuery(year ? `overview:classes:${year}` : null, () => listClasses({ academic_year_id: year }));
  const invoices = useQuery(year ? `overview:invoices:${year}` : null, () => listInvoices({ academic_year_id: year }));
  const exams = useQuery(year ? `overview:exams:${year}` : null, () => listExamSchedules({ academic_year_id: year }));

  const activeStudents = (students.data ?? []).filter((s) => (s.status ?? "ACTIVE") === "ACTIVE").length;
  const activeStaff = (staff.data ?? []).filter((s) => (s.status ?? "ACTIVE") === "ACTIVE").length;
  const teachingStaff = (staff.data ?? []).filter((s) => s.staff_type === "TEACHING").length;

  const fees = (invoices.data ?? []).reduce(
    (acc, inv) => {
      const a = invoiceAmounts(inv);
      return { collected: acc.collected + a.paid, outstanding: acc.outstanding + a.balance, unpaid: acc.unpaid + (a.balance > 0 ? 1 : 0) };
    },
    { collected: 0, outstanding: 0, unpaid: 0 }
  );

  const today = todayInput();
  const upcoming = [...(exams.data ?? [])]
    .filter((e) => e.exam_date.slice(0, 10) >= today && e.status !== "CANCELLED")
    .sort((a, b) => a.exam_date.localeCompare(b.exam_date))
    .slice(0, 5);

  // A failure in one card shouldn't hide the rest of the page
  const firstError = yearsError || students.error || staff.error || classes.error || invoices.error || exams.error;

  if (!yearsLoading && years.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <PageHeader title="Welcome" description="Set up the school year to get started" />
        {yearsError && <Alert type="error">{yearsError}</Alert>}
        <EmptyState>
          No academic year yet.{" "}
          <Link href="/dashboard/academic-years/new" className="font-medium text-foreground underline">
            Create one
          </Link>{" "}
          before adding classes, students or fees.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title="Overview"
        description={currentYear ? `Academic year ${currentYear.name}` : undefined}
        action={
          <div className="flex flex-wrap gap-2">
            {QUICK_LINKS.map((link) => (
              <Button key={link.href} variant="outline" size="sm" asChild>
                <Link href={link.href}>{link.label}</Link>
              </Button>
            ))}
          </div>
        }
      />

      {firstError && <Alert type="error">{firstError}</Alert>}

      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatTile label="Active students" value={students.loading ? "…" : activeStudents} />
        <StatTile label="Staff" value={staff.loading ? "…" : `${activeStaff} (${teachingStaff} teaching)`} />
        <StatTile label="Classes this year" value={classes.loading ? "…" : (classes.data ?? []).length} />
        <StatTile label="Fees outstanding" value={invoices.loading ? "…" : formatCurrency(fees.outstanding)} tone={fees.outstanding > 0 ? "red" : "green"} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Card
          title="Upcoming exams"
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/exams/schedules">All exams</Link>
            </Button>
          }
        >
          {exams.loading ? (
            <Loading />
          ) : upcoming.length === 0 ? (
            <EmptyState>No exams scheduled from today onwards.</EmptyState>
          ) : (
            <ul className="divide-y rounded-md border text-sm">
              {upcoming.map((exam) => (
                <li key={getId(exam)} className="flex items-center justify-between gap-2 px-3 py-2">
                  <Link href={`/dashboard/exams/schedules/${getId(exam)}/marks`} className="font-medium hover:underline">
                    {exam.name}
                  </Link>
                  <span className="text-muted-foreground">
                    {formatDate(exam.exam_date)} · {formatEnum(exam.exam_type)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card
          title="Fees this year"
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/fees/invoices">All invoices</Link>
            </Button>
          }
        >
          {invoices.loading ? (
            <Loading />
          ) : (invoices.data ?? []).length === 0 ? (
            <EmptyState>No invoices generated yet.</EmptyState>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              <StatTile label="Invoices" value={(invoices.data ?? []).length} />
              <StatTile label="Collected" value={formatCurrency(fees.collected)} tone="green" />
              <StatTile label="Unpaid invoices" value={fees.unpaid} tone={fees.unpaid > 0 ? "red" : undefined} />
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
