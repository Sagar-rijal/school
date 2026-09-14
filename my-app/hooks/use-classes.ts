"use client";

import { useEffect, useState } from "react";
import { listClasses } from "@/lib/academic";
import { getId } from "@/lib/api";
import type { SchoolClass } from "@/lib/types/academic";
import { byDisplayOrder, getErrorMessage } from "@/lib/utils";

/** Loads every class in the school (all academic years), sorted by display order. */
export function useClasses() {
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listClasses()
      .then((data) => setClasses([...(data ?? [])].sort(byDisplayOrder)))
      .catch((err) => setError(getErrorMessage(err, "Failed to load classes")))
      .finally(() => setLoading(false));
  }, []);

  const classNameById = (id: string) => classes.find((c) => getId(c) === id)?.name ?? "Unknown class";

  return { classes, loading, error, classNameById };
}
