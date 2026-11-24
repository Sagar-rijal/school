"use client";

import type { ReactNode } from "react";
import { Alert, PageHeader, Select } from "@/components/form";
import { EmptyState, Loading } from "@/components/data-display";
import { useFamily, type FamilyState } from "@/hooks/use-family";
import type { FamilyChild } from "@/lib/family";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { studentLabel } from "@/lib/students";

export type FamilyContext = FamilyState & { child: FamilyChild };

/** "Class 5 · Section A", or "" when class names aren't visible to this user. */
export function useClassLabel() {
  const lookup = useAcademicLookup();
  return (child: FamilyChild) => {
    const e = child.enrollment;
    if (!e) return "";
    const cls = lookup.className(e.class_id);
    const sec = lookup.sectionName(e.section_id);
    return [cls !== "—" ? cls : "", sec !== "—" ? `Section ${sec}` : ""].filter(Boolean).join(" · ");
  };
}

export function ChildSwitcher({ family }: { family: FamilyState }) {
  if (!family.isParent || family.children.length < 2) return null;
  return (
    <Select aria-label="Child" value={family.child?.studentId ?? ""} onChange={(e) => family.setChildId(e.target.value)} className="w-auto min-w-44">
      {family.children.map((c) => <option key={c.studentId} value={c.studentId}>{studentLabel(c.student)}</option>)}
    </Select>
  );
}

/** Page shell for the family portal: resolves the student/children, then renders for the selected child. */
export default function FamilyPage({
  title,
  description,
  maxWidth = "max-w-5xl",
  children,
}: {
  title: string;
  description?: string;
  maxWidth?: string;
  children: (ctx: FamilyContext) => ReactNode;
}) {
  const family = useFamily();
  const classLabel = useClassLabel();
  const child = family.child;
  const subtitle = child && family.isParent
    ? [studentLabel(child.student), classLabel(child)].filter(Boolean).join(" · ")
    : description;

  return (
    <div className={`mx-auto ${maxWidth} space-y-5`}>
      <PageHeader title={title} description={subtitle} action={<ChildSwitcher family={family} />} />
      {family.loading ? <Loading /> : family.error ? <Alert type="error">{family.error}</Alert> : !child ? (
        <EmptyState>No student is linked to your account yet.</EmptyState>
      ) : (
        // key: reset page state when a parent switches child
        <div key={child.studentId} className="space-y-5">{children({ ...family, child })}</div>
      )}
    </div>
  );
}
