"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Field, PageHeader } from "@/components/form";
import ClassSectionPicker, { type ClassSectionValue } from "@/components/class-section-picker";
import StudentForm from "@/components/students/student-form";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { findCreatedId } from "@/lib/api";
import { createStudent, enrollStudent } from "@/lib/students";
import { emptyToNull, omit } from "@/lib/utils";

export default function NewStudentPage() {
  const router = useRouter();
  const { years, defaultYearId } = useAcademicYears();
  const [enrollment, setEnrollment] = useState<ClassSectionValue>({ year: "", class: "", section: "" });
  const [rollNumber, setRollNumber] = useState("");

  const enrollmentValue = { ...enrollment, year: enrollment.year || defaultYearId };
  const wantsEnrollment = !!(enrollmentValue.class && enrollmentValue.section);

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Add student" backHref="/dashboard/students" />
      <StudentForm
        submitLabel={wantsEnrollment ? "Add and enroll student" : "Add student"}
        onSubmit={async (result) => {
          // StudentCreate has no status; new students start active
          const studentId = findCreatedId(await createStudent(omit(result, "status")));

          if (!studentId) {
            // Can't enroll or open the profile without the new ID
            router.push("/dashboard/students");
            return;
          }
          if (wantsEnrollment) {
            try {
              await enrollStudent({
                student_id: studentId,
                academic_year_id: enrollmentValue.year,
                class_id: enrollmentValue.class,
                section_id: enrollmentValue.section,
                roll_number: emptyToNull(rollNumber),
              });
            } catch {
              // The student exists; enrollment can be retried from the profile page
              router.push(`/dashboard/students/${studentId}?enrollFailed=1`);
              return;
            }
          }
          router.push(`/dashboard/students/${studentId}`);
        }}
      >
        <fieldset className="space-y-3">
          <legend className="mb-2 w-full border-b pb-2 text-base font-semibold">Enroll in a class (optional)</legend>
          <ClassSectionPicker years={years} value={enrollmentValue} onChange={setEnrollment} />
          {wantsEnrollment && (
            <Field label="Roll number" htmlFor="roll_number" className="max-w-40">
              <Input id="roll_number" value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} />
            </Field>
          )}
          <p className="text-xs text-muted-foreground">You can also enroll the student later from their profile.</p>
        </fieldset>
      </StudentForm>
    </div>
  );
}
