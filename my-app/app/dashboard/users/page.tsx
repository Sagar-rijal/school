"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/form";

// The backend has no "list users" endpoint, so users are created here and their
// roles are managed by user ID (staff and parent profiles will link here too).
export default function UsersPage() {
  const router = useRouter();
  const [userId, setUserId] = useState("");

  const handleLookup = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = userId.trim();
    if (id) router.push(`/dashboard/users/${encodeURIComponent(id)}/roles`);
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Users" description="Login accounts and their roles" />

      <div className="grid gap-4 md:grid-cols-2">
        <section className="flex flex-col justify-between gap-4 rounded-lg border bg-card p-5">
          <div>
            <h2 className="font-semibold">Create a user</h2>
            <p className="text-sm text-muted-foreground">
              Add a login for an admin, teacher, accountant or parent, then assign their role.
            </p>
          </div>
          <Button asChild className="self-start">
            <Link href="/dashboard/users/new">+ Create user</Link>
          </Button>
        </section>

        <section className="rounded-lg border bg-card p-5">
          <h2 className="font-semibold">Manage roles</h2>
          <p className="mb-4 text-sm text-muted-foreground">Look up a user by their ID.</p>
          <form onSubmit={handleLookup} className="flex gap-2">
            <Input
              aria-label="User ID"
              placeholder="User ID"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="font-mono"
            />
            <Button type="submit" variant="outline" disabled={!userId.trim()}>
              Open
            </Button>
          </form>
        </section>
      </div>
    </div>
  );
}
