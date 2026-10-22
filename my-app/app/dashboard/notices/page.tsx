"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";
import ClassSectionPicker, { type ClassSectionValue } from "@/components/class-section-picker";
import { useSession } from "@/components/session-provider";
import { Alert, Field, PageHeader, Select } from "@/components/form";
import { Card, EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { hasPermission } from "@/lib/access";
import { getId } from "@/lib/api";
import { createTextNotice, IMPORTANCE_LEVELS, listSentNotices, type Importance } from "@/lib/notices";
import { formatEnum, getErrorMessage } from "@/lib/utils";

export default function NoticesPage() {
  const session = useSession();
  const years = useAcademicYears();
  const [selection, setSelection] = useState<ClassSectionValue>({ year: "", class: "", section: "" });
  const value = { ...selection, year: selection.year || years.defaultYearId };
  const [audience, setAudience] = useState<"SCHOOL" | "CLASS">("SCHOOL");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [importance, setImportance] = useState<Importance>("NORMAL");
  const [publish, setPublish] = useState(true);
  const [after, setAfter] = useState("");
  const sent = useQuery(`notices-sent:${after}`, () => listSentNotices(after || undefined));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const canSend = session ? hasPermission(session, "notification:send") : false;
  const canSendSchoolwide = session ? hasPermission(session, "notification:schoolwide") : false;
  const effectiveAudience = audience === "SCHOOL" && !canSendSchoolwide ? "CLASS" : audience;

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setResult("");
    if (effectiveAudience === "CLASS" && (!value.year || !value.class)) { setError("Select an academic year and class for this notice."); return; }
    if (importance === "URGENT" && session && !hasPermission(session, "notification:urgent")) {
      setError("You do not have permission to send urgent notices."); return;
    }
    setBusy(true);
    try {
      await createTextNotice({ title: title.trim(), message: message.trim(), importance, publish,
        audience: effectiveAudience === "SCHOOL" ? { scope: "SCHOOL" } : { scope: "CLASS", academic_year_id: value.year,
          class_id: value.class, section_id: value.section || null } });
      setTitle(""); setMessage(""); setResult(publish ? "Notice sent." : "Notice saved as a draft."); sent.reload();
    } catch (err) { setError(getErrorMessage(err, "Could not create notice")); }
    finally { setBusy(false); }
  };

  return <div className="mx-auto max-w-5xl space-y-5">
    <PageHeader title="Notices" description="School announcements and sent messages" />
    {(years.error || sent.error || error) && <Alert type="error">{years.error || sent.error || error}</Alert>}
    {result && <Alert type="success">{result}</Alert>}
    {canSend && <Card title="Create text notice"><form onSubmit={submit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Title" htmlFor="notice-title" required><Input id="notice-title" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Importance" htmlFor="notice-importance"><Select id="notice-importance" value={importance} onChange={(e) => setImportance(e.target.value as Importance)}>{IMPORTANCE_LEVELS.filter((item) => item !== "URGENT" || (session && hasPermission(session, "notification:urgent"))).map((item) => <option key={item} value={item}>{formatEnum(item)}</option>)}</Select></Field>
        <Field label="Audience" htmlFor="notice-audience"><Select id="notice-audience" value={effectiveAudience} onChange={(e) => setAudience(e.target.value as "SCHOOL" | "CLASS")}><option value="SCHOOL" disabled={!canSendSchoolwide}>Whole school</option><option value="CLASS">Class or section</option></Select></Field>
      </div>
      {effectiveAudience === "CLASS" && <ClassSectionPicker years={years.years} value={value} onChange={setSelection} />}
      <Field label="Message" htmlFor="notice-message" required><textarea id="notice-message" required maxLength={10000} rows={5} value={message} onChange={(e) => setMessage(e.target.value)} className="w-full rounded-md border border-input bg-transparent p-3 text-sm" /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} /> Publish now</label>
      <Button type="submit" disabled={busy}>{busy ? "Saving..." : publish ? "Send notice" : "Save draft"}</Button>
    </form></Card>}
    <Card title="Sent notices">{sent.loading ? <Loading /> : (sent.data?.items.length ?? 0) === 0 ? <EmptyState>No notices found.</EmptyState> : <Table><THead><tr><TH>Notice</TH><TH>Importance</TH><TH>Status</TH><TH>Created</TH><TH>Open</TH></tr></THead><TBody>{sent.data?.items.map((item, index) => <tr key={getId(item) || index}><TD><span className="font-medium">{item.title}</span></TD><TD>{formatEnum(item.importance ?? "NORMAL")}</TD><TD>{formatEnum(item.status ?? "DRAFT")}</TD><TD>{item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</TD><TD>{getId(item) && <Button size="sm" variant="outline" asChild><Link href={`/dashboard/notices/${getId(item)}`}>View</Link></Button>}</TD></tr>)}</TBody></Table>}
      {sent.data?.next && <Button className="mt-4" variant="outline" onClick={() => setAfter(sent.data!.next!)}>Next page</Button>}
    </Card>
  </div>;
}
