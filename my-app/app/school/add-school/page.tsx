"use client";
import SchoolForm from "@/components/school-form";
import { addSchool } from "@/lib/school";

export default function AddSchoolPage() {
  // We pass the addSchool API function directly into the component
  return (
    <SchoolForm 
      onSubmit={addSchool} 
      isEditMode={false} 
    />
  );
}