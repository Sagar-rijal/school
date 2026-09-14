"use client";

import { Select } from "@/components/form";
import { getId } from "@/lib/api";
import type { AcademicYear } from "@/lib/types/academic";

type Props = {
  id?: string;
  years: AcademicYear[];
  value: string;
  onChange: (yearId: string) => void;
  disabled?: boolean;
  className?: string;
};

export default function AcademicYearSelect({ id = "academic_year_id", years, value, onChange, disabled, className }: Props) {
  return (
    <Select
      id={id}
      name="academic_year_id"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled || years.length === 0}
      className={className}
    >
      {years.length === 0 && <option value="">No academic years</option>}
      {years.map((y) => (
        <option key={getId(y)} value={getId(y)}>
          {y.name}
          {y.is_current ? " (current)" : ""}
        </option>
      ))}
    </Select>
  );
}
