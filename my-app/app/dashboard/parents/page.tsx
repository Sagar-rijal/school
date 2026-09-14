"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, PageHeader } from "@/components/form";
import { EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { listParents } from "@/lib/students";
import { fullName } from "@/lib/utils";

export default function ParentsPage() {
  const parents = useQuery("parents", listParents);
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const rows = [...(parents.data ?? [])]
    .filter((p) => !query || fullName(p).toLowerCase().includes(query) || p.phone?.includes(query))
    .sort((a, b) => fullName(a).localeCompare(fullName(b)));

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Parents & guardians"
        description="Link parents to students from a student's profile"
        backHref="/dashboard/students"
        action={
          <Button asChild>
            <Link href="/dashboard/parents/new">+ Add parent</Link>
          </Button>
        }
      />

      <Input
        type="search"
        aria-label="Search parents"
        placeholder="Search name or phone"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full sm:w-72"
      />

      {parents.error && <div className="mb-4"><Alert type="error">{parents.error}</Alert></div>}

      {parents.loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState>{query ? "No parents match your search." : "No parents yet."}</EmptyState>
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Phone</TH>
              <TH>Email</TH>
              <TH>Occupation</TH>
              <TH>Children</TH>
              <TH />
            </tr>
          </THead>
          <TBody>
            {rows.map((p) => (
              <tr key={getId(p)} className="hover:bg-muted/30">
                <TD className="font-medium">{fullName(p)}</TD>
                <TD>{p.phone}</TD>
                <TD>{p.email || "—"}</TD>
                <TD>{p.occupation || "—"}</TD>
                <TD>{p.student_ids?.length ?? 0}</TD>
                <TD className="text-right">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/parents/${getId(p)}`}>Edit</Link>
                  </Button>
                </TD>
              </tr>
            ))}
          </TBody>
        </Table>
      )}
    </div>
  );
}
