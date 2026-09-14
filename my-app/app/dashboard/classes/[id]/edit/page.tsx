"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, PageHeader } from "@/components/form";
import ClassForm from "@/components/classes/class-form";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { getClass, updateClass } from "@/lib/academic";
import type { SchoolClass } from "@/lib/types/academic";
import { getErrorMessage } from "@/lib/utils";

export default function EditClassPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { years, loading: yearsLoading } = useAcademicYears();
  const [cls, setCls] = useState<SchoolClass | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getClass(id)
      .then(setCls)
      .catch((err) => setError(getErrorMessage(err, "Failed to load class")));
  }, [id]);

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Edit class" backHref={`/dashboard/classes/${id}`} />
      {error && <Alert type="error">{error}</Alert>}
      {(!cls || yearsLoading) && !error && <p className="text-muted-foreground">Loading...</p>}
      {cls && !yearsLoading && (
        <ClassForm
          years={years}
          initialData={cls}
          submitLabel="Save changes"
          // Only name and display order are editable
          onSubmit={({ name, display_order }) => updateClass(id, { name, display_order })}
          onSuccess={() => router.push(`/dashboard/classes/${id}`)}
        />
      )}
    </div>
  );
}
