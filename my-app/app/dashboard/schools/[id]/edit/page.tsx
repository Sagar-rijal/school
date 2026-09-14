"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, PageHeader } from "@/components/form";
import SchoolForm from "@/components/schools/school-form";
import { getSchool, updateSchool } from "@/lib/school";
import type { School } from "@/lib/types/school";
import { getErrorMessage } from "@/lib/utils";

export default function EditSchoolPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [school, setSchool] = useState<School | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getSchool(id)
      .then(setSchool)
      .catch((err) => setError(getErrorMessage(err, "Failed to load school")));
  }, [id]);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Edit school" backHref="/dashboard/schools" />
      {error && <Alert type="error">{error}</Alert>}
      {!school && !error && <p className="text-muted-foreground">Loading school...</p>}
      {school && (
        <SchoolForm
          initialData={school}
          submitLabel="Save changes"
          onSubmit={(payload) => updateSchool(id, payload)}
          onSuccess={() => router.push("/dashboard/schools")}
        />
      )}
    </div>
  );
}
