"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { Alert, PageHeader } from "@/components/form";
import { Loading } from "@/components/data-display";
import StudentForm from "@/components/students/student-form";
import { useQuery } from "@/hooks/use-query";
import { getStudent, updateStudent } from "@/lib/students";
import { omit } from "@/lib/utils";

export default function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const student = useQuery(`student:${id}`, () => getStudent(id));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Edit student" backHref={`/dashboard/students/${id}`} />
      {student.error && <Alert type="error">{student.error}</Alert>}
      {student.loading && <Loading />}
      {student.data && (
        <StudentForm
          initialData={student.data}
          submitLabel="Save changes"
          onSubmit={async (result) => {
            // The admission number can't be changed
            await updateStudent(id, omit(result, "admission_number"));
            router.push(`/dashboard/students/${id}`);
          }}
        />
      )}
    </div>
  );
}
