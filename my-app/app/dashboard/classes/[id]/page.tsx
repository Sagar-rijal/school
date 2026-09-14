"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, PageHeader } from "@/components/form";
import { Loading } from "@/components/data-display";
import SectionsManager from "@/components/classes/sections-manager";
import TeacherAssignments from "@/components/classes/teacher-assignments";
import { getClass } from "@/lib/academic";
import type { SchoolClass } from "@/lib/types/academic";
import { getErrorMessage } from "@/lib/utils";

export default function ClassDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [cls, setCls] = useState<SchoolClass | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getClass(id)
      .then(setCls)
      .catch((err) => setError(getErrorMessage(err, "Failed to load class")));
  }, [id]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={cls?.name ?? "Class"}
        description="Sections and teachers of this class"
        backHref={cls ? `/dashboard/classes?year=${cls.academic_year_id}` : "/dashboard/classes"}
        action={
          cls && (
            <Button variant="outline" asChild>
              <Link href={`/dashboard/classes/${id}/edit`}>Edit class</Link>
            </Button>
          )
        }
      />
      {error && <Alert type="error">{error}</Alert>}
      {!cls && !error && <Loading />}
      {cls && (
        <div className="grid items-start gap-6 lg:grid-cols-2">
          <section className="space-y-3">
            <h2 className="font-semibold">Sections</h2>
            <SectionsManager classId={id} yearId={cls.academic_year_id} />
          </section>
          <TeacherAssignments classId={id} yearId={cls.academic_year_id} />
        </div>
      )}
    </div>
  );
}
