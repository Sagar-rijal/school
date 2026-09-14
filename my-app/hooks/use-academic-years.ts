"use client";

import { useEffect, useState } from "react";
import { listAcademicYears } from "@/lib/academic";
import { getId } from "@/lib/api";
import type { AcademicYear } from "@/lib/types/academic";
import { getErrorMessage } from "@/lib/utils";

/**
 * Loads the school's academic years (newest first).
 * `defaultYearId` is the current year, or the newest one if none is marked current.
 */
export function useAcademicYears() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listAcademicYears()
      .then((data) =>
        setYears([...(data ?? [])].sort((a, b) => b.start_date.localeCompare(a.start_date)))
      )
      .catch((err) => setError(getErrorMessage(err, "Failed to load academic years")))
      .finally(() => setLoading(false));
  }, []);

  const current = years.find((y) => y.is_current) ?? years[0];

  return { years, loading, error, defaultYearId: current ? getId(current) : "" };
}
