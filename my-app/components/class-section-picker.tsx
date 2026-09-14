"use client";

import { Select } from "@/components/form";
import AcademicYearSelect from "@/components/academic-years/academic-year-select";
import { useQuery } from "@/hooks/use-query";
import { listClasses, listSections } from "@/lib/academic";
import { getId } from "@/lib/api";
import type { AcademicYear } from "@/lib/types/academic";
import { byDisplayOrder, cn } from "@/lib/utils";

export type ClassSectionValue = { year: string; class: string; section: string };

type Props = {
  years: AcademicYear[];
  value: ClassSectionValue;
  onChange: (value: ClassSectionValue) => void;
  /** Label for the empty class/section option, e.g. "All classes" or "Select class". */
  classPlaceholder?: string;
  sectionPlaceholder?: string;
  /** Hide the section select (for pages that work per class). */
  hideSection?: boolean;
  className?: string;
};

/** Year → class → section selects. Changing a parent clears its children. */
export default function ClassSectionPicker({
  years,
  value,
  onChange,
  classPlaceholder = "Select class",
  sectionPlaceholder = "Select section",
  hideSection,
  className,
}: Props) {
  const classes = useQuery(value.year ? `classes:${value.year}` : null, async () =>
    [...((await listClasses({ academic_year_id: value.year })) ?? [])].sort(byDisplayOrder)
  );
  const sections = useQuery(value.class && !hideSection ? `sections:${value.class}` : null, async () =>
    [...((await listSections({ class_id: value.class })) ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { numeric: true })
    )
  );

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <AcademicYearSelect
        id="picker-year"
        years={years}
        value={value.year}
        onChange={(year) => onChange({ year, class: "", section: "" })}
        className="w-auto min-w-36"
      />
      <Select
        aria-label="Class"
        value={value.class}
        onChange={(e) => onChange({ ...value, class: e.target.value, section: "" })}
        disabled={!value.year || classes.loading}
        className="w-auto min-w-36"
      >
        <option value="">{classes.loading ? "Loading classes..." : classPlaceholder}</option>
        {classes.data?.map((c) => (
          <option key={getId(c)} value={getId(c)}>
            {c.name}
          </option>
        ))}
      </Select>
      {!hideSection && (
        <Select
          aria-label="Section"
          value={value.section}
          onChange={(e) => onChange({ ...value, section: e.target.value })}
          disabled={!value.class || sections.loading}
          className="w-auto min-w-36"
        >
          <option value="">{sections.loading ? "Loading sections..." : sectionPlaceholder}</option>
          {sections.data?.map((s) => (
            <option key={getId(s)} value={getId(s)}>
              Section {s.name}
            </option>
          ))}
        </Select>
      )}
    </div>
  );
}
