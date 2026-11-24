import Link from "next/link";
import { PageHeader } from "@/components/form";
import { Card, EmptyState } from "@/components/data-display";
import { roleLabel, visibleAreas, type Session } from "@/lib/access";

export default function StaffOverview({ session }: { session: Session }) {
  const areas = visibleAreas(session).filter((area) => !area.href.startsWith("/dashboard/teacher"));
  return <div className="mx-auto max-w-4xl space-y-5">
    <PageHeader title={`${roleLabel(session)} workspace`} description={`Signed in as ${session.email}`} />
    <Card title="Your sections">
      {areas.length === 0 ? <EmptyState>No sections have been assigned to this account yet.</EmptyState> :
        <div className="grid gap-3 sm:grid-cols-2">{areas.map((area) => <Link key={area.href} href={area.href} className="rounded-lg border p-4 font-medium hover:bg-accent">{area.label}</Link>)}</div>}
    </Card>
  </div>;
}
