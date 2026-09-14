"use client";

import { useRouter } from "next/navigation";
import { Alert, PageHeader } from "@/components/form";
import { Loading } from "@/components/data-display";
import StaffForm from "@/components/staff/staff-form";
import { useQuery } from "@/hooks/use-query";
import { listSubjects } from "@/lib/academic";
import { createStaff, listDepartments, toStaffCreate } from "@/lib/staff";

export default function NewStaffPage() {
  const router = useRouter();
  const departments = useQuery("departments", listDepartments);
  const subjects = useQuery("subjects", async () => (await listSubjects()) ?? []);
  const error = departments.error || subjects.error;

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Add staff member" backHref="/dashboard/staff" />
      {error && <div className="mb-4"><Alert type="error">{error}</Alert></div>}
      {departments.loading || subjects.loading ? (
        <Loading />
      ) : (
        <StaffForm
          departments={departments.data ?? []}
          subjects={subjects.data ?? []}
          submitLabel="Add staff member"
          onSubmit={(result) => createStaff(toStaffCreate(result))}
          onSuccess={() => router.push("/dashboard/staff")}
        />
      )}
    </div>
  );
}
