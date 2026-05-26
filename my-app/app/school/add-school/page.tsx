"use client";
import SchoolForm, { SchoolDataPayload } from "@/components/school-form";
import { addSchool } from "@/lib/school";

export default function AddSchoolPage() {
  const handleSubmit = (payload: SchoolDataPayload & { status: number }) => {
    return addSchool({
      ...payload,
      school_info: {
        ...payload.school_info,
        establishedYear: Number(payload.school_info.establishedYear),
      },
    });
  };

  return (
    <SchoolForm
      onSubmit={handleSubmit}
      isEditMode={false}
    />
  );
}
