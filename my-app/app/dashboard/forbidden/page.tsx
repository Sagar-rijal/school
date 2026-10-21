import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ForbiddenPage() {
  return (
    <div className="mx-auto mt-16 max-w-md text-center">
      <ShieldAlert className="mx-auto size-10 text-muted-foreground" />
      <h1 className="mt-4 text-xl font-semibold">You don&apos;t have access to this page</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Your role doesn&apos;t include this area. If you think that&apos;s wrong, ask your administrator.
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">Go to your dashboard</Link>
      </Button>
    </div>
  );
}
