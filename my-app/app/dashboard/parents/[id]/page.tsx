"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Alert, PageHeader } from "@/components/form";
import { Loading } from "@/components/data-display";
import ParentForm from "@/components/students/parent-form";
import { useQuery } from "@/hooks/use-query";
import { deleteParent, getParent, updateParent } from "@/lib/students";
import { fullName, getErrorMessage, omit } from "@/lib/utils";

export default function EditParentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const parent = useQuery(`parent:${id}`, () => getParent(id));
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!parent.data || !window.confirm(`Delete ${fullName(parent.data)}? They will be unlinked from all students.`)) return;
    try {
      await deleteParent(id);
      router.push("/dashboard/parents");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete parent"));
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <PageHeader title={parent.data ? fullName(parent.data) : "Parent"} backHref="/dashboard/parents" />
      {(parent.error || error) && <Alert type="error">{parent.error || error}</Alert>}
      {parent.loading && <Loading />}
      {parent.data && (
        <>
          <ParentForm
            initialData={parent.data}
            submitLabel="Save changes"
            onSubmit={async (payload) => {
              // ParentUpdate doesn't accept user_id (links are set at creation)
              await updateParent(id, omit(payload, "user_id"));
              router.push("/dashboard/parents");
            }}
          />
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">Delete parent</Button>
          </div>
        </>
      )}
    </div>
  );
}
