"use client";

import { use, useState } from "react";
import { useSession } from "@/components/session-provider";
import { Alert, Field, PageHeader } from "@/components/form";
import { Card, DetailList, Loading } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { useQuery } from "@/hooks/use-query";
import { hasPermission } from "@/lib/access";
import { archiveNotice, getNotice, publishNotice } from "@/lib/notices";
import { formatEnum, getErrorMessage } from "@/lib/utils";

export default function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const session = useSession();
  const notice = useQuery(`notice:${id}`, () => getNotice(id));
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canSend = session ? hasPermission(session, "notification:send") : false;
  const item = notice.data;
  const status = item?.status?.toUpperCase() ?? "";

  const publish = async () => {
    setError(""); setMessage(""); setBusy(true);
    try { await publishNotice(id); setMessage("Notice published."); notice.reload(); }
    catch (err) { setError(getErrorMessage(err, "Could not publish notice")); }
    finally { setBusy(false); }
  };
  const archive = async () => {
    if (!reason.trim()) { setError("Enter a reason for archiving this notice."); return; }
    setError(""); setMessage(""); setBusy(true);
    try { await archiveNotice(id, reason.trim()); setMessage("Notice archived."); notice.reload(); }
    catch (err) { setError(getErrorMessage(err, "Could not archive notice")); }
    finally { setBusy(false); }
  };

  return <div className="mx-auto max-w-4xl space-y-5">
    <PageHeader title={item?.title ?? "Notice"} description="Sent notice details" backHref="/dashboard/notices" />
    {(notice.error || error) && <Alert type="error">{notice.error || error}</Alert>}
    {message && <Alert type="success">{message}</Alert>}
    {notice.loading ? <Loading /> : item && <Card title="Notice"><DetailList items={[
      { label: "Status", value: formatEnum(status) },
      { label: "Importance", value: formatEnum(item.importance ?? "NORMAL") },
      { label: "Audience", value: formatEnum(item.audience?.scope ?? "SCHOOL") },
      { label: "Created", value: item.created_at ? new Date(item.created_at).toLocaleString() : undefined },
      { label: "Published", value: item.sent_at ? new Date(item.sent_at).toLocaleString() : undefined },
    ]} /><p className="mt-4 whitespace-pre-wrap text-sm">{item.message}</p></Card>}
    {item && canSend && status !== "ARCHIVED" && <Card title="Manage notice"><div className="space-y-4">
      {status === "DRAFT" && <Button disabled={busy} onClick={publish}>{busy ? "Saving..." : "Publish notice"}</Button>}
      <Field label="Archive reason" htmlFor="archive-reason"><textarea id="archive-reason" rows={2} required maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-md border border-input bg-transparent p-3 text-sm" /></Field>
      <Button variant="outline" disabled={busy} onClick={archive}>Archive notice</Button>
    </div></Card>}
  </div>;
}
