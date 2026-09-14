"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, PageHeader } from "@/components/form";
import { Card, DetailList, Loading, StatusBadge } from "@/components/data-display";
import StaffForm from "@/components/staff/staff-form";
import TeacherClassesCard from "@/components/staff/teacher-classes-card";
import { useQuery } from "@/hooks/use-query";
import { listSubjects } from "@/lib/academic";
import { getStaffMember, listDepartments, toStaffUpdate, updateStaff } from "@/lib/staff";
import { formatDate, formatEnum, fullName } from "@/lib/utils";
import { STAFF_STATUS_TONES } from "@/lib/types/staff";

export default function StaffMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const member = useQuery(`staff:${id}`, () => getStaffMember(id));
  const departments = useQuery("departments", listDepartments);
  const subjects = useQuery("subjects", async () => (await listSubjects()) ?? []);

  const loading = member.loading || departments.loading || subjects.loading;
  const data = member.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        title={data ? fullName(data) : "Staff member"}
        description={data ? `${formatEnum(data.staff_type)} · ${data.employee_id}` : undefined}
        backHref="/dashboard/staff"
        action={data && <StatusBadge value={data.status ?? "ACTIVE"} tones={STAFF_STATUS_TONES} />}
      />

      {member.error && <Alert type="error">{member.error}</Alert>}
      {loading && !member.error && <Loading />}

      {data && !loading && (
        <>
          <Card
            title="Overview"
            action={
              <div className="flex flex-wrap gap-2">
                {data.user_id && (
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/users/${data.user_id}/roles`}>Login roles</Link>
                  </Button>
                )}
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/dashboard/timetable/teacher?staff=${id}`}>Weekly schedule</Link>
                </Button>
              </div>
            }
          >
            <DetailList
              items={[
                { label: "Email", value: data.email },
                { label: "Phone", value: data.phone },
                { label: "Joined", value: formatDate(data.joining_date) },
                { label: "Employment", value: formatEnum(data.employment_type) },
                { label: "Login account", value: data.user_id ? "Linked" : "Not linked" },
              ]}
            />
          </Card>

          {data.staff_type === "TEACHING" && <TeacherClassesCard userId={data.user_id} />}

          <div>
            <h2 className="mb-3 font-semibold">Edit details</h2>
            <StaffForm
              departments={departments.data ?? []}
              subjects={subjects.data ?? []}
              initialData={data}
              submitLabel="Save changes"
              onSubmit={(result) => updateStaff(id, toStaffUpdate(result))}
              onSuccess={() => {
                member.reload();
                router.refresh();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            />
          </div>
        </>
      )}
    </div>
  );
}
