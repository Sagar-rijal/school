"use client";

import { useState } from "react";
import Link from "next/link";
import ClassSectionPicker, { type ClassSectionValue } from "@/components/class-section-picker";
import FeesNav from "@/components/fees/fees-nav";
import { Alert, Field, PageHeader } from "@/components/form";
import { EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { getOutstandingFeeReport } from "@/lib/fees";
import { formatCurrency, formatDate, todayInput } from "@/lib/utils";

export default function OutstandingFeesPage() {
  const years = useAcademicYears();
  const [selection, setSelection] = useState<ClassSectionValue>({ year: "", class: "", section: "" });
  const value = { ...selection, year: selection.year || years.defaultYearId };
  const [asOf, setAsOf] = useState(todayInput());
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const after = cursors[cursors.length - 1];
  const report = useQuery(`outstanding:${value.year}:${value.class}:${asOf}:${after ?? "first"}`,
    () => getOutstandingFeeReport({ academic_year_id: value.year || undefined, class_id: value.class || undefined,
      as_of: asOf ? new Date(`${asOf}T23:59:59`).toISOString() : undefined, after }));
  const rows = report.data?.items ?? [];
  const total = rows.reduce((sum, row) => sum + (row.balance_due ?? row.outstanding_amount ?? row.total_outstanding ?? row.amount_due ?? 0), 0);

  return <div className="mx-auto max-w-5xl space-y-5">
    <PageHeader title="Outstanding fees" description="Unpaid balances as of a selected date" />
    <FeesNav />
    {(years.error || report.error) && <Alert type="error">{years.error || report.error}</Alert>}
    <div className="flex flex-wrap items-end gap-3"><ClassSectionPicker years={years.years} value={value} hideSection onChange={(next) => { setSelection(next); setCursors([undefined]); }} />
      <Field label="As of" htmlFor="outstanding-date"><Input id="outstanding-date" type="date" value={asOf} onChange={(e) => { setAsOf(e.target.value); setCursors([undefined]); }} className="w-auto" /></Field></div>
    {report.loading ? <Loading /> : rows.length === 0 ? <EmptyState>No outstanding fees match these filters.</EmptyState> : <>
      <p className="text-sm text-muted-foreground">This page: {rows.length} records · {formatCurrency(total)} outstanding</p>
      <Table><THead><tr><TH>Student</TH><TH>Invoice</TH><TH>Due date</TH><TH>Balance</TH></tr></THead><TBody>{rows.map((row, index) => <tr key={row.id ?? row._id ?? row.invoice_id ?? index}><TD>{row.student_id ? <Link href={`/dashboard/students/${row.student_id}`} className="text-link hover:underline">{row.student_name || row.admission_number || row.student_id}</Link> : row.student_name || "—"}</TD><TD>{row.invoice_id ? <Link href={`/dashboard/fees/invoices/${row.invoice_id}`} className="text-link hover:underline">{row.invoice_number || row.invoice_id}</Link> : row.invoice_number || "—"}</TD><TD>{formatDate(row.due_date)}</TD><TD>{formatCurrency(row.balance_due ?? row.outstanding_amount ?? row.total_outstanding ?? row.amount_due ?? 0)}</TD></tr>)}</TBody></Table>
    </>}
    <div className="flex gap-2">{cursors.length > 1 && <Button variant="outline" size="sm" onClick={() => setCursors((old) => old.slice(0, -1))}>Previous</Button>}{report.data?.next && <Button variant="outline" size="sm" onClick={() => setCursors((old) => [...old, report.data!.next!])}>Next</Button>}</div>
  </div>;
}
