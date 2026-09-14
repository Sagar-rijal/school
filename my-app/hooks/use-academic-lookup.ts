"use client";

import { useQuery } from "@/hooks/use-query";
import { listAcademicYears, listClasses, listSections, listSubjects } from "@/lib/academic";
import { getId } from "@/lib/api";

/**
 * Loads years, classes, sections and subjects once so pages can show names for IDs
 * (e.g. enrollment history, exam lists). Missing names fall back to "—".
 */
export function useAcademicLookup() {
  const years = useQuery("lookup:years", async () => (await listAcademicYears()) ?? []);
  const classes = useQuery("lookup:classes", async () => (await listClasses()) ?? []);
  const sections = useQuery("lookup:sections", async () => (await listSections()) ?? []);
  const subjects = useQuery("lookup:subjects", async () => (await listSubjects()) ?? []);

  const nameOf = (list: { name: string; _id?: string; id?: string }[] | undefined, id?: string | null) =>
    (id && list?.find((item) => getId(item) === id)?.name) || "—";

  return {
    loading: years.loading || classes.loading || sections.loading || subjects.loading,
    yearName: (id?: string | null) => nameOf(years.data, id),
    className: (id?: string | null) => nameOf(classes.data, id),
    sectionName: (id?: string | null) => nameOf(sections.data, id),
    subjectName: (id?: string | null) => nameOf(subjects.data, id),
    classes: classes.data ?? [],
    sections: sections.data ?? [],
    subjects: subjects.data ?? [],
  };
}
