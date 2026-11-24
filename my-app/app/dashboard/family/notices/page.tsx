"use client";

import { useState } from "react";
import FamilyPage, { type FamilyContext } from "@/components/family/family-page";
import { Alert } from "@/components/form";
import { EmptyState, Loading, StatusBadge } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { fileContentUrl } from "@/lib/files";
import { listInboxNotices, markNoticeRead, type InboxNotice } from "@/lib/notices";
import { cn, getErrorMessage } from "@/lib/utils";

const noticeId = (n: InboxNotice) => n.notification_id ?? getId(n);
const isRead = (n: InboxNotice) => !!n.read_at || n.is_read === true;

function NoticeBody({ notice }: { notice: InboxNotice }) {
  const message = notice.message ?? notice.notification?.message;
  const blocks = notice.blocks ?? notice.notification?.blocks ?? [];
  const attachments = notice.attachment_ids ?? notice.notification?.attachment_ids ?? [];
  const bullets = blocks.filter((b) => b.kind === "BULLET");
  return (
    <div className="space-y-2 text-sm">
      {message && <p className="whitespace-pre-wrap">{message}</p>}
      {blocks.filter((b) => b.kind !== "BULLET").map((b, i) =>
        b.kind === "HEADING" ? <p key={i} className="font-semibold">{b.text}</p> : <p key={i} className="whitespace-pre-wrap">{b.text}</p>
      )}
      {bullets.length > 0 && <ul className="list-disc pl-5">{bullets.map((b, i) => <li key={i}>{b.text}</li>)}</ul>}
      {attachments.length > 0 && (
        <ul className="flex flex-wrap gap-3">{attachments.map((a, i) => <li key={a}><a href={fileContentUrl(a)} target="_blank" rel="noopener noreferrer" className="text-primary underline">Attachment {i + 1}</a></li>)}</ul>
      )}
    </div>
  );
}

function Inbox({ child, isParent }: FamilyContext) {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [after, setAfter] = useState("");
  const [openId, setOpenId] = useState("");
  const [error, setError] = useState("");
  const childId = isParent ? child.studentId : undefined;
  const inbox = useQuery(`family-inbox:${childId ?? "me"}:${unreadOnly}:${after}`, () => listInboxNotices(after || undefined, { childId, unread: unreadOnly || undefined }));

  const open = async (n: InboxNotice) => {
    const id = noticeId(n);
    setOpenId(openId === id ? "" : id);
    if (isRead(n) || !id) return;
    try {
      await markNoticeRead(id);
      inbox.setData((prev) => prev && { ...prev, items: prev.items.map((x) => (noticeId(x) === id ? { ...x, is_read: true } : x)) });
    } catch (err) { setError(getErrorMessage(err, "Could not mark notice as read")); }
  };

  return (
    <>
      {(error || inbox.error) && <Alert type="error">{error || inbox.error}</Alert>}
      <div className="flex gap-2">
        <Button variant={!unreadOnly ? "default" : "outline"} onClick={() => { setUnreadOnly(false); setAfter(""); }}>All</Button>
        <Button variant={unreadOnly ? "default" : "outline"} onClick={() => { setUnreadOnly(true); setAfter(""); }}>Unread</Button>
      </div>
      {inbox.loading ? <Loading /> : (inbox.data?.items.length ?? 0) === 0 ? <EmptyState>{unreadOnly ? "You're all caught up." : "No notices yet."}</EmptyState> : (
        <ul className="divide-y rounded-lg border bg-card">
          {inbox.data!.items.map((n, i) => {
            const id = noticeId(n);
            const importance = n.importance ?? n.notification?.importance;
            const when = n.sent_at ?? n.created_at;
            return (
              <li key={id || i}>
                <button type="button" onClick={() => open(n)} className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-accent/50">
                  <span className="flex items-center gap-2">
                    {!isRead(n) && <span className="size-2 rounded-full bg-primary" aria-label="Unread" />}
                    <span className={cn(!isRead(n) && "font-semibold")}>{n.title ?? n.notification?.title ?? "Notice"}</span>
                  </span>
                  <span className="flex items-center gap-2 text-xs text-muted-foreground">
                    {importance && importance !== "NORMAL" && <StatusBadge value={importance} tones={{ IMPORTANT: "yellow", URGENT: "red" }} />}
                    {when ? new Date(when).toLocaleString() : ""}
                  </span>
                </button>
                {openId === id && <div className="px-4 pb-4"><NoticeBody notice={n} /></div>}
              </li>
            );
          })}
        </ul>
      )}
      {inbox.data?.next && <Button variant="outline" onClick={() => setAfter(inbox.data!.next!)}>Older notices</Button>}
    </>
  );
}

export default function FamilyNoticesPage() {
  return <FamilyPage title="Notices" description="Announcements from school">{(ctx) => <Inbox {...ctx} />}</FamilyPage>;
}
