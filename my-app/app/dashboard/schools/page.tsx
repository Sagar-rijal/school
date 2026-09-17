"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, PageHeader } from "@/components/form";
import { EmptyState, Loading, StatusBadge, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { getAllSchools } from "@/lib/school";
import type { School } from "@/lib/types/school";
import { getId } from "@/lib/api";
import { formatEnum, getErrorMessage } from "@/lib/utils";

const STATUS_TONES = { ACTIVE: "green", INACTIVE: "gray" } as const;

export default function AllSchoolsPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const { created } = use(searchParams);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchSchools = () =>
      getAllSchools()
        .then((data) => {
          setSchools(data ?? []);
          setError("");
        })
        .catch((err) => setError(getErrorMessage(err, "Failed to load schools")))
        .finally(() => setIsLoading(false));

    fetchSchools();

    // Refresh when the tab regains focus, e.g. after editing in another tab
    const onVisible = () => document.visibilityState === "visible" && fetchSchools();
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Schools"
        description="Schools managed on this platform"
        action={
          <Button asChild>
            <Link href="/dashboard/schools/new">+ Add school</Link>
          </Button>
        }
      />

      {created && <div className="mb-4"><Alert type="success">School added successfully.</Alert></div>}
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}

      {isLoading ? (
        <Loading>Loading schools...</Loading>
      ) : schools.length === 0 ? (
        <EmptyState>No schools yet. Add your first school to get started.</EmptyState>
      ) : (
        <>
          <Table>
            <THead>
              <tr>
                <TH>Name</TH>
                <TH>Board</TH>
                <TH>Location</TH>
                <TH>Established</TH>
                <TH>Status</TH>
                <TH />
              </tr>
            </THead>
            <TBody>
              {schools.map((school) => {
                const id = getId(school);
                return (
                  <tr key={id || school.school_info?.name} className="hover:bg-muted/30">
                    <TD>
                      <Link href={`/dashboard/schools/${id}/edit`} className="font-medium text-link hover:underline">
                        {school.school_info?.name}
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {school.school_info?.type ? formatEnum(school.school_info.type) : "—"}
                      </p>
                    </TD>
                    <TD>
                      {school.school_info?.board}
                      <span className="text-muted-foreground"> · {school.school_info?.medium ? formatEnum(school.school_info.medium) : "—"}</span>
                    </TD>
                    <TD>{[school.address?.city, school.address?.state].filter(Boolean).join(", ") || "—"}</TD>
                    <TD>{school.school_info?.establishedYear || "—"}</TD>
                    <TD>
                      <StatusBadge value={school.status === 1 ? "ACTIVE" : "INACTIVE"} tones={STATUS_TONES} />
                    </TD>
                    <TD className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/dashboard/schools/${id}/edit`}>Edit</Link>
                      </Button>
                    </TD>
                  </tr>
                );
              })}
            </TBody>
          </Table>
          <p className="mt-2 text-right text-xs text-muted-foreground">
            {schools.length} school{schools.length === 1 ? "" : "s"}
          </p>
        </>
      )}
    </div>
  );
}
