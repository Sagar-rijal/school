"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { useSession } from "@/components/session-provider";
import { useQuery } from "@/hooks/use-query";
import { resolveFamily } from "@/lib/family";

/** The child a parent is currently looking at; remembered across pages and reloads. */
const useSelectedChild = create<{ childId: string; setChildId: (id: string) => void }>()(
  persist((set) => ({ childId: "", setChildId: (childId) => set({ childId }) }), { name: "family-child" })
);

/**
 * The signed-in student, or the signed-in parent's children, plus the one selected.
 * For a student, `child` is always themselves.
 */
export function useFamily() {
  const session = useSession();
  const family = useQuery(session ? `family:${session.id}` : null, () => resolveFamily(session!));
  const { childId, setChildId } = useSelectedChild();
  const children = family.data?.children ?? [];
  const child = children.find((c) => c.studentId === childId) ?? children[0] ?? null;

  return {
    loading: family.loading,
    error: family.error,
    isParent: family.data?.role === "PARENT",
    isStudent: family.data?.role === "STUDENT",
    children,
    child,
    setChildId,
  };
}

export type FamilyState = ReturnType<typeof useFamily>;
