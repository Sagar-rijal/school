"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, PageHeader } from "@/components/form";
import { Card, EmptyState, Loading, StatTile, StatusBadge } from "@/components/data-display";
import { useQuery } from "@/hooks/use-query";
import { getAllSchools } from "@/lib/school";
import { getSchoolId } from "@/lib/types/school";

const STATUS_TONES = { ACTIVE: "green", INACTIVE: "gray" } as const;

/** Super admin home: the schools on the platform and how to onboard a new one. */
export default function PlatformOverview() {
  const schools = useQuery("overview:schools", async () => (await getAllSchools()) ?? []);
  const list = schools.data ?? [];
  const active = list.filter((s) => s.status === 1).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Platform overview"
        description="Every school on the platform"
        action={
          <div className="flex flex-wrap gap-2">
            <Button size="sm" asChild>
              <Link href="/dashboard/schools/new">+ Add school</Link>
            </Button>
          </div>
        }
      />

      {schools.error && <Alert type="error">{schools.error}</Alert>}

      <div className="grid grid-cols-3 gap-2">
        <StatTile label="Schools" value={schools.loading ? "…" : list.length} />
        <StatTile label="Active" value={schools.loading ? "…" : active} tone="green" />
        <StatTile label="Inactive" value={schools.loading ? "…" : list.length - active} />
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        <Card
          title="Schools"
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/schools">View all</Link>
            </Button>
          }
        >
          {schools.loading ? (
            <Loading />
          ) : list.length === 0 ? (
            <EmptyState>No schools yet.</EmptyState>
          ) : (
            <ul className="divide-y rounded-md border text-sm">
              {list.slice(0, 6).map((school) => (
                <li key={getSchoolId(school)} className="flex items-center justify-between gap-2 px-3 py-2">
                  <div className="min-w-0">
                    <Link href={`/dashboard/schools/${getSchoolId(school)}/edit`} className="font-medium text-link hover:underline">
                      {school.school_info?.name}
                    </Link>
                    <p className="truncate text-xs text-muted-foreground">
                      {[school.address?.city, school.address?.state].filter(Boolean).join(", ") || "—"}
                    </p>
                  </div>
                  <StatusBadge value={school.status === 1 ? "ACTIVE" : "INACTIVE"} tones={STATUS_TONES} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card title="Onboard a school">
          <ol className="space-y-3 text-sm">
            {[
              { step: "Enter the school details", href: "/dashboard/schools/new", cta: "Add school" },
              { step: "Save the administrator credentials shown after creation" },
              { step: "Give the credentials to the administrator, who signs in and changes the temporary password" },
            ].map((item, i) => (
              <li key={item.step} className="flex items-start gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                  {i + 1}
                </span>
                <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                  <span>{item.step}</span>
                  {item.href && (
                    <Link href={item.href} className="text-xs font-medium text-link hover:underline">
                      {item.cta} →
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-xs text-muted-foreground">
            The school admin then sets up academic years, classes, staff and students for their school.
          </p>
        </Card>
      </div>
    </div>
  );
}
