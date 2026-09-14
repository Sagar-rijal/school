"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, PageHeader } from "@/components/form";
import { Card, DetailList, Loading, StatusBadge } from "@/components/data-display";
import AttendanceCard from "@/components/students/attendance-card";
import EnrollmentsPanel from "@/components/students/enrollments-panel";
import ParentsPanel from "@/components/students/parents-panel";
import { useQuery } from "@/hooks/use-query";
import { deleteStudent, getStudent } from "@/lib/students";
import { STUDENT_STATUS_TONES } from "@/lib/types/student";
import { formatDate, formatEnum, fullName, getErrorMessage } from "@/lib/utils";

export default function StudentProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ enrollFailed?: string }>;
}) {
  const { id } = use(params);
  const { enrollFailed } = use(searchParams);
  const router = useRouter();
  const student = useQuery(`student:${id}`, () => getStudent(id));
  const [deleteError, setDeleteError] = useState("");

  const data = student.data;

  const handleDelete = async () => {
    if (!data || !window.confirm(`Delete ${fullName(data)}? This removes the student record permanently.`)) return;
    try {
      await deleteStudent(id);
      router.push("/dashboard/students");
    } catch (err) {
      setDeleteError(getErrorMessage(err, "Failed to delete student"));
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title={data ? fullName(data) : "Student"}
        description={data ? `Admission no. ${data.admission_number}` : undefined}
        backHref="/dashboard/students"
        action={
          data && (
            <div className="flex items-center gap-2">
              <StatusBadge value={data.status ?? "ACTIVE"} tones={STUDENT_STATUS_TONES} />
              <Button variant="outline" asChild>
                <Link href={`/dashboard/students/${id}/edit`}>Edit</Link>
              </Button>
            </div>
          )
        }
      />

      {enrollFailed && <Alert type="error">The student was added, but enrollment failed. Enroll them below.</Alert>}
      {(student.error || deleteError) && <Alert type="error">{student.error || deleteError}</Alert>}
      {student.loading && <Loading />}

      {data && (
        <>
          <Card title="Details">
            <DetailList
              items={[
                { label: "Date of birth", value: formatDate(data.date_of_birth) },
                { label: "Gender", value: data.gender && formatEnum(data.gender) },
                { label: "Blood group", value: data.blood_group },
                { label: "Phone", value: data.phone },
                { label: "Email", value: data.email },
                { label: "Address", value: data.address },
                {
                  label: "Emergency contact",
                  value: data.emergency_contact && `${data.emergency_contact.name} (${data.emergency_contact.relation}) · ${data.emergency_contact.phone}`,
                },
              ]}
            />
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <EnrollmentsPanel studentId={id} />
            <ParentsPanel studentId={id} />
          </div>

          <AttendanceCard studentId={id} />

          <div className="flex justify-end">
            <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
              Delete student
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
