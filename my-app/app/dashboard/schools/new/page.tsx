"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Alert, PageHeader } from "@/components/form";
import SchoolForm from "@/components/schools/school-form";
import { addSchool } from "@/lib/school";
import type { SchoolCreation } from "@/lib/types/school";
import { getSchoolId } from "@/lib/types/school";

export default function NewSchoolPage() {
  const [created, setCreated] = useState<SchoolCreation | null>(null);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Add school" description="Register a new school" backHref="/dashboard/schools" />
      {created ? (
        <div className="space-y-5 rounded-lg border bg-card p-5 sm:p-6">
          <Alert type="success">{created.school.school_info.name} was created with a school administrator.</Alert>
          <div className="space-y-3 text-sm">
            <p><span className="text-muted-foreground">School ID:</span> <code>{getSchoolId(created.school)}</code></p>
            <p><span className="text-muted-foreground">Admin email:</span> <strong>{created.admin_email}</strong></p>
            <p><span className="text-muted-foreground">Admin user ID:</span> <code>{created.admin_user_id}</code></p>
            <p><span className="text-muted-foreground">Temporary password:</span> <code className="rounded bg-muted px-2 py-1">{created.temp_admin_password}</code></p>
          </div>
          <p className="text-sm text-muted-foreground">Save the temporary password before leaving this screen. The API returns it during creation; the schools list does not include it.</p>
          <div className="flex flex-wrap gap-2">
            <Button asChild><Link href={`/dashboard/schools/${getSchoolId(created.school)}/edit`}>View school</Link></Button>
            <Button variant="outline" asChild><Link href="/dashboard/schools">All schools</Link></Button>
          </div>
        </div>
      ) : (
        <SchoolForm submitLabel="Add school" onSubmit={async (payload) => setCreated(await addSchool(payload))} />
      )}
    </div>
  );
}
