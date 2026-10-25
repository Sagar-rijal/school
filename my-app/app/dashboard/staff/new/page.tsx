"use client";

import { useState } from "react";
import Link from "next/link";
import { Alert, PageHeader } from "@/components/form";
import { Card, DetailList, Loading } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import StaffForm from "@/components/staff/staff-form";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { listSubjects } from "@/lib/academic";
import { createStaff, listDepartments, toStaffCreate } from "@/lib/staff";
import type { StaffCreation } from "@/lib/types/staff";

export default function NewStaffPage() {
  const [created, setCreated] = useState<StaffCreation | null>(null);
  const departments = useQuery("departments", listDepartments);
  const subjects = useQuery("subjects", async () => (await listSubjects()) ?? []);
  const error = departments.error || subjects.error;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title={created ? "Staff account created" : "Add staff member"} backHref="/dashboard/staff" />
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
      {created ? (
        <Card title="Login details">
          <div className="space-y-5">
            <Alert type="success">The staff record and login account were created. Share these details with the staff member securely.</Alert>
            <DetailList items={[
              { label: "Name", value: `${created.staff.first_name} ${created.staff.last_name}` },
              { label: "Email", value: created.staff.email },
              { label: "Employee ID", value: created.staff.employee_id },
              { label: "Login user ID", value: created.staff.user_id },
            ]} />
            {created.temp_password ? (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
                <p className="font-semibold">Temporary password — shown only now</p>
                <p className="mt-2 break-all font-mono text-base select-all">{created.temp_password}</p>
                <p className="mt-2">The staff member signs in with the email above and changes this password on first login. It will not be shown again after leaving this page.</p>
              </div>
            ) : <Alert type="error">The backend did not return a temporary password. The staff record exists, so do not create it again. Arrange a password reset for this account.</Alert>}
            {created.staff.staff_type === "TEACHING" && <p className="text-sm text-muted-foreground">Next, assign this teacher to a class and subject under Classes. Their teaching workspace will show those assignments after they sign in.</p>}
            <div className="flex flex-wrap gap-2">
              {getId(created.staff) && <Button asChild><Link href={`/dashboard/staff/${getId(created.staff)}`}>Open staff record</Link></Button>}
              {created.staff.user_id && <Button variant="outline" asChild><Link href={`/dashboard/users/${created.staff.user_id}/roles`}>View login roles</Link></Button>}
              {created.staff.staff_type === "TEACHING" && <Button variant="outline" asChild><Link href="/dashboard/classes">Assign classes</Link></Button>}
              <Button variant="outline" asChild><Link href="/dashboard/staff">All staff</Link></Button>
            </div>
          </div>
        </Card>
      ) : departments.loading || subjects.loading ? (
        <Loading />
      ) : (
        <StaffForm
          departments={departments.data ?? []}
          subjects={subjects.data ?? []}
          submitLabel="Add staff member"
          onSubmit={async (result) => { setCreated(await createStaff(toStaffCreate(result))); }}
        />
      )}
    </div>
  );
}
