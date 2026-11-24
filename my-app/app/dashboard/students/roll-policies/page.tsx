"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { Alert, Field, PageHeader, Select } from "@/components/form";
import { Card, EmptyState, Loading, NumberStats, StatusBadge, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { listClasses } from "@/lib/academic";
import { configureRollPolicy, listRollPolicies, previewLegacyRollMigration, ROLL_UNIQUE_SCOPES } from "@/lib/students";
import { byDisplayOrder, formatEnum, getErrorMessage } from "@/lib/utils";

export default function RollPoliciesPage() {
  const lookup = useAcademicLookup();
  const { years, defaultYearId } = useAcademicYears();
  const [yearId, setYearId] = useState("");
  const year = yearId || defaultYearId;
  const [classId, setClassId] = useState("");
  const classes = useQuery(year ? `classes:${year}` : null, () => listClasses({ academic_year_id: year }));
  const policies = useQuery(year ? `roll-policies:${year}:${classId}` : null, () => listRollPolicies({ academic_year_id: year, class_id: classId || undefined }));

  const [rollType, setRollType] = useState("CLASS_ROLL");
  const [scope, setScope] = useState<(typeof ROLL_UNIQUE_SCOPES)[number]>("SECTION");
  const [enabled, setEnabled] = useState(true);
  const [reason, setReason] = useState("");
  const [migration, setMigration] = useState<unknown>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const save = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); setError(""); setMessage("");
    if (!classId) { setError("Select a class."); return; }
    setBusy(true);
    try {
      await configureRollPolicy({ academic_year_id: year, class_id: classId, roll_type: rollType.trim(), unique_scope: scope, enabled, reason: reason.trim() });
      setReason(""); setMessage("Roll policy saved."); policies.reload();
    } catch (err) { setError(getErrorMessage(err, "Could not save roll policy")); }
    finally { setBusy(false); }
  };

  const dryRun = async () => {
    setBusy(true); setError("");
    try { setMigration(await previewLegacyRollMigration()); }
    catch (err) { setError(getErrorMessage(err, "Could not preview migration")); }
    finally { setBusy(false); }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader title="Roll number policies" description="How roll numbers are assigned and kept unique per class" backHref="/dashboard/students" />
      {(error || policies.error || classes.error) && <Alert type="error">{error || policies.error || classes.error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      <div className="flex flex-wrap gap-2">
        <Select aria-label="Academic year" value={year} onChange={(e) => { setYearId(e.target.value); setClassId(""); }} className="w-auto">
          {years.map((y) => <option key={getId(y)} value={getId(y)}>{y.name}</option>)}
        </Select>
        <Select aria-label="Class" value={classId} onChange={(e) => setClassId(e.target.value)} className="w-auto min-w-40">
          <option value="">All classes</option>
          {[...(classes.data ?? [])].sort(byDisplayOrder).map((c) => <option key={getId(c)} value={getId(c)}>{c.name}</option>)}
        </Select>
      </div>

      {classId && (
        <Card title="Set policy for this class">
          <form onSubmit={save} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Roll type" htmlFor="roll-type" required hint="e.g. CLASS_ROLL, EXAM_ROLL">
                <Input id="roll-type" required value={rollType} onChange={(e) => setRollType(e.target.value.toUpperCase())} />
              </Field>
              <Field label="Unique within" htmlFor="roll-scope">
                <Select id="roll-scope" value={scope} onChange={(e) => setScope(e.target.value as typeof scope)}>
                  {ROLL_UNIQUE_SCOPES.map((s) => <option key={s} value={s}>{formatEnum(s)}</option>)}
                </Select>
              </Field>
              <Field label="Reason" htmlFor="roll-reason" required>
                <Input id="roll-reason" required minLength={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Enabled
            </label>
            <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save policy"}</Button>
          </form>
        </Card>
      )}

      {policies.loading || lookup.loading ? <Loading /> : (policies.data?.length ?? 0) === 0 ? <EmptyState>No roll policies yet.</EmptyState> : (
        <Table>
          <THead><tr><TH>Class</TH><TH>Roll type</TH><TH>Unique within</TH><TH>Status</TH><TH>Reason</TH></tr></THead>
          <TBody>
            {policies.data!.map((p, i) => (
              <tr key={getId(p) || i}>
                <TD>{lookup.className(p.class_id)}</TD>
                <TD className="font-mono text-xs">{p.roll_type}</TD>
                <TD>{formatEnum(p.unique_scope ?? "SCHOOL")}</TD>
                <TD><StatusBadge value={p.enabled === false ? "DISABLED" : "ENABLED"} tones={{ ENABLED: "green", DISABLED: "gray" }} /></TD>
                <TD className="text-muted-foreground">{p.reason || "—"}</TD>
              </tr>
            ))}
          </TBody>
        </Table>
      )}

      <Card title="Legacy roll numbers" action={<Button size="sm" variant="outline" disabled={busy} onClick={dryRun}>Preview migration</Button>}>
        <p className="mb-3 text-sm text-muted-foreground">Checks how existing roll numbers on enrollments would move into roll policies. Nothing is changed.</p>
        {migration !== null && (
          <div className="space-y-3">
            <NumberStats data={migration} />
            <details className="text-xs"><summary className="cursor-pointer text-muted-foreground">Full report</summary>
              <pre className="mt-2 max-h-80 overflow-auto rounded-md bg-muted p-3">{JSON.stringify(migration, null, 2)}</pre>
            </details>
          </div>
        )}
      </Card>
    </div>
  );
}
