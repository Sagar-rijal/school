"use client";

import { use } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, PageHeader, Select } from "@/components/form";
import { EmptyState, Loading, StatusBadge, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { useQuery } from "@/hooks/use-query";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { getId } from "@/lib/api";
import { listDepartments, listStaff } from "@/lib/staff";
import { STAFF_STATUS_TONES, STAFF_STATUSES, STAFF_TYPES } from "@/lib/types/staff";
import { formatEnum, fullName } from "@/lib/utils";

type Filters = { department?: string; type?: string; status?: string };

export default function StaffPage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = use(searchParams);
  const setFilters = useUrlFilters("/dashboard/staff", filters);

  const departments = useQuery("departments", listDepartments);
  const staff = useQuery(`staff:${filters.department}:${filters.type}:${filters.status}`, () =>
    listStaff({ department_id: filters.department, staff_type: filters.type, status: filters.status })
  );

  const departmentName = (id?: string | null) =>
    departments.data?.find((d) => getId(d) === id)?.name ?? "—";

  const rows = [...(staff.data ?? [])].sort((a, b) => fullName(a).localeCompare(fullName(b)));

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Staff"
        description="Teaching, non-teaching and administrative staff"
        action={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href="/dashboard/staff/departments">Departments</Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/staff/new">+ Add staff</Link>
            </Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Select aria-label="Department" value={filters.department ?? ""} onChange={(e) => setFilters({ department: e.target.value })} className="w-auto min-w-40">
          <option value="">All departments</option>
          {departments.data?.map((d) => <option key={getId(d)} value={getId(d)}>{d.name}</option>)}
        </Select>
        <Select aria-label="Staff type" value={filters.type ?? ""} onChange={(e) => setFilters({ type: e.target.value })} className="w-auto min-w-40">
          <option value="">All types</option>
          {STAFF_TYPES.map((t) => <option key={t} value={t}>{formatEnum(t)}</option>)}
        </Select>
        <Select aria-label="Status" value={filters.status ?? ""} onChange={(e) => setFilters({ status: e.target.value })} className="w-auto min-w-36">
          <option value="">Any status</option>
          {STAFF_STATUSES.map((s) => <option key={s} value={s}>{formatEnum(s)}</option>)}
        </Select>
      </div>

      {staff.error && <div className="mb-4"><Alert type="error">{staff.error}</Alert></div>}

      {staff.loading ? (
        <Loading>Loading staff...</Loading>
      ) : rows.length === 0 ? (
        <EmptyState>No staff match these filters.</EmptyState>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Employee ID</TH>
              <TH>Type</TH>
              <TH>Designation</TH>
              <TH>Department</TH>
              <TH>Status</TH>
              <TH className="text-right">Actions</TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((member) => (
              <tr key={getId(member)} className="hover:bg-muted/30">
                <TD>
                  <p className="font-medium">{fullName(member)}</p>
                  <p className="text-xs text-muted-foreground">{member.email}</p>
                </TD>
                <TD className="font-mono text-xs">{member.employee_id}</TD>
                <TD>{formatEnum(member.staff_type)}</TD>
                <TD>{member.designation || "—"}</TD>
                <TD>{departmentName(member.department_id)}</TD>
                <TD><StatusBadge value={member.status ?? "ACTIVE"} tones={STAFF_STATUS_TONES} /></TD>
                <TD className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/staff/${getId(member)}`}>Open</Link>
                  </Button>
                </TD>
              </tr>
            ))}
          </TBody>
        </Table>
      )}
      {!staff.loading && rows.length > 0 && (
        <p className="mt-2 text-right text-xs text-muted-foreground">{rows.length} staff member{rows.length === 1 ? "" : "s"}</p>
      )}
    </div>
  );
}
