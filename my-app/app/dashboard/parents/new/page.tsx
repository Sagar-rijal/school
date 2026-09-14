"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/form";
import ParentForm from "@/components/students/parent-form";
import { createParent } from "@/lib/students";

export default function NewParentPage({ searchParams }: { searchParams: Promise<{ student?: string }> }) {
  const { student } = use(searchParams);
  const router = useRouter();
  const backHref = student ? `/dashboard/students/${student}` : "/dashboard/parents";

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Add parent"
        description={student ? "The new parent will be linked to the student" : undefined}
        backHref={backHref}
      />
      <ParentForm
        showUserId
        submitLabel={student ? "Add and link parent" : "Add parent"}
        onSubmit={async (payload) => {
          await createParent({ ...payload, student_ids: student ? [student] : [] });
          router.push(backHref);
        }}
      />
    </div>
  );
}
