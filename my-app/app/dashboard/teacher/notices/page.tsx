"use client";

import { useState } from "react";
import { PageHeader, Alert } from "@/components/form";
import { EmptyState, Loading } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { useQuery } from "@/hooks/use-query";
import { listInboxNotices, markNoticeRead } from "@/lib/notices";
import { getId } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";

export default function TeacherNoticesPage() {
  const [after, setAfter] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const query = useQuery(`teacher-inbox:${after}`, () => listInboxNotices(after || undefined));
  const read = async (id: string) => {
    setBusy(id); setError("");
    try { await markNoticeRead(id); query.reload(); }
    catch (err) { setError(getErrorMessage(err, "Could not mark notice as read")); }
    finally { setBusy(""); }
  };
  return <div className="mx-auto max-w-4xl space-y-5"><PageHeader title="My notices" description="Messages sent to your account" backHref="/dashboard/teacher" />
    {(error || query.error) && <Alert type="error">{error || query.error}</Alert>}
    {query.loading ? <Loading /> : !query.data?.items.length ? <EmptyState>No notices in your inbox.</EmptyState> :
      <ul className="space-y-3">{query.data.items.map((item, index) => { const id = item.notification_id || getId(item); return <li key={id || index} className="rounded-lg border bg-card p-4"><div className="flex justify-between gap-3"><div><h2 className="font-semibold">{item.title || item.notification?.title || "Notice"}</h2><p className="mt-1 whitespace-pre-wrap text-sm">{item.message || item.notification?.message || ""}</p></div>{!item.read_at && !item.is_read && id && <Button size="sm" variant="outline" disabled={busy === id} onClick={() => read(id)}>Mark read</Button>}</div>{(item.sent_at || item.created_at) && <p className="mt-2 text-xs text-muted-foreground">{new Date(item.sent_at || item.created_at!).toLocaleString()}</p>}</li>; })}</ul>}
    {query.data?.next && <Button variant="outline" onClick={() => setAfter(query.data!.next!)}>Next page</Button>}
  </div>;
}
