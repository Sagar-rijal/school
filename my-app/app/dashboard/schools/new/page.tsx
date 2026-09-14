"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/form";
import SchoolForm from "@/components/schools/school-form";
import { addSchool } from "@/lib/school";

export default function NewSchoolPage() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Add school" description="Register a new school" backHref="/dashboard/schools" />
      <SchoolForm
        submitLabel="Add school"
        onSubmit={addSchool}
        onSuccess={() => router.push("/dashboard/schools?created=1")}
      />
    </div>
  );
}
