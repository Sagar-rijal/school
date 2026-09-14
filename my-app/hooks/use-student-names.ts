"use client";

import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { listStudents, studentLabel } from "@/lib/students";
import type { Student } from "@/lib/types/student";

/** Loads all students once to show names next to student IDs (invoices, payments, results). */
export function useStudentNames() {
  const students = useQuery("students:all", () => listStudents());
  const byId = new Map<string, Student>((students.data ?? []).map((s) => [getId(s), s]));

  return {
    loading: students.loading,
    student: (id?: string | null) => (id ? byId.get(id) : undefined),
    name: (id?: string | null) => {
      const s = id ? byId.get(id) : undefined;
      return s ? studentLabel(s) : "Unknown student";
    },
  };
}
