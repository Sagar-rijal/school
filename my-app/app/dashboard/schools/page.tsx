"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, PageHeader } from "@/components/form";
import { EmptyState, Loading, StatusBadge, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { deleteSchool, getAllSchools, updateSchool } from "@/lib/school";
import type { School } from "@/lib/types/school";
import { getSchoolId } from "@/lib/types/school";
import { formatEnum, getErrorMessage } from "@/lib/utils";

const STATUS_TONES = { ACTIVE: "green", INACTIVE: "gray" } as const;
// The live backend does not currently expose DELETE /tenant/{school_id}.
const SCHOOL_DELETION_ENABLED = process.env.NEXT_PUBLIC_SCHOOL_DELETE_ENABLED === "true";

export default function AllSchoolsPage() {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);

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

  const toggleSchool = async (school: School) => {
    const id = getSchoolId(school);
    if (!id) return;
    const nextStatus = school.status === 1 ? 0 : 1;
    if (nextStatus === 0 && !window.confirm(`Disable ${school.school_info.name}? You can enable it again later.`)) return;

    setBusyId(id);
    setError("");
    try {
      const updated = await updateSchool(id, { status: nextStatus });
      setSchools((current) => current.map((item) => getSchoolId(item) === id ? updated : item));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update school status"));
    } finally {
      setBusyId(null);
    }
  };

  const removeSchool = async (school: School) => {
    const id = getSchoolId(school);
    if (!id || school.status !== 0) return;
    const name = school.school_info.name;
    if (window.prompt(`Delete ${name} permanently? Type the school name to confirm.`) !== name) return;

    setBusyId(id);
    setError("");
    try {
      await deleteSchool(id);
      setSchools((current) => current.filter((item) => getSchoolId(item) !== id));
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete school"));
    } finally {
      setBusyId(null);
    }
  };

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
                const id = getSchoolId(school);
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
                    <TD>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" disabled={!id || busyId !== null} onClick={() => toggleSchool(school)} className={school.status === 1 ? "text-red-600 hover:text-red-700" : undefined}>
                          {busyId === id ? "Saving..." : school.status === 1 ? "Disable" : "Enable"}
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/dashboard/schools/${id}/edit`}>Edit</Link>
                        </Button>
                        {SCHOOL_DELETION_ENABLED && school.status === 0 && (
                          <Button variant="destructive" size="sm" disabled={!id || busyId !== null} onClick={() => removeSchool(school)}>
                            {busyId === id ? "Deleting..." : "Delete"}
                          </Button>
                        )}
                      </div>
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
