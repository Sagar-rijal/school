"use client";

import { useSession } from "@/components/session-provider";
import { listAssignmentsByTeacher } from "@/lib/academic";
import { isTeacherUser } from "@/lib/access";
import type { TeacherAssignment } from "@/lib/types/academic";
import { useQuery } from "./use-query";

export function matchesAssignment(assignments: TeacherAssignment[], year: string, classId: string, sectionId: string, subjectId?: string) {
  return assignments.some((item) => item.academic_year_id === year && item.class_id === classId &&
    item.section_id === sectionId && (!subjectId || !item.subject_id || item.subject_id === subjectId));
}

export function useTeacherAssignments() {
  const session = useSession();
  const teacher = !!session && isTeacherUser(session);
  const query = useQuery(teacher && session?.id ? `teacher-assignments:${session.id}` : null,
    () => listAssignmentsByTeacher(session!.id));
  return { teacher, ...query, assignments: query.data ?? [] };
}
