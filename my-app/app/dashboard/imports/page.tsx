"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { Alert, Field, PageHeader, Select } from "@/components/form";
import { Card, EmptyState, Loading, NumberStats, StatusBadge, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@/hooks/use-query";
import {
  commitImport,
  getImport,
  IMPORT_KINDS,
  importErrorsUrl,
  importId,
  importTemplateUrl,
  listImportRows,
  previewImport,
  retryImport,
  type ImportKind,
  type ImportRow,
} from "@/lib/imports";
import { formatEnum, getErrorMessage } from "@/lib/utils";

const STATUS_TONES = { VALIDATED: "blue", PREVIEWED: "blue", COMMITTED: "green", COMPLETED: "green", FAILED: "red", PARTIAL: "yellow", PROCESSING: "yellow" } as const;

function rowErrors(row: ImportRow) {
  return (row.errors ?? []).map((e) => (typeof e === "string" ? e : [e.field, e.message ?? e.msg].filter(Boolean).join(": "))).join("; ");
}

export default function ImportsPage() {
  const [kind, setKind] = useState<ImportKind>("students");
  const [file, setFile] = useState<File | null>(null);
  const [provisionLogins, setProvisionLogins] = useState(false);
  const [currentId, setCurrentId] = useState("");
  const [after, setAfter] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const job = useQuery(currentId ? `import:${currentId}` : null, () => getImport(currentId));
  const rows = useQuery(currentId ? `import-rows:${currentId}:${after}` : null, () => listImportRows(currentId, after));
  const status = String(job.data?.status ?? "").toUpperCase();
  const hash = job.data?.preview_hash;
  const failed = status === "FAILED" || status === "PARTIAL";
  const done = status === "COMMITTED" || status === "COMPLETED";

  const run = async (action: () => Promise<unknown>, success: string, fallback: string) => {
    setBusy(true); setError(""); setMessage("");
    try { await action(); setMessage(success); job.reload(); rows.reload(); }
    catch (err) { setError(getErrorMessage(err, fallback)); }
    finally { setBusy(false); }
  };

  const preview = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) { setError("Choose a CSV file."); return; }
    setBusy(true); setError(""); setMessage("");
    try {
      const created = await previewImport(file, kind, provisionLogins);
      setAfter(0);
      setCurrentId(importId(created));
      setMessage("File checked. Review the rows below, then import.");
    } catch (err) { setError(getErrorMessage(err, "Could not check the file")); }
    finally { setBusy(false); }
  };

  const commit = () => {
    if (!hash || !window.confirm("Import the valid rows? Records will be created.")) return;
    run(() => commitImport(currentId, hash), "Import started. Refresh to see progress.", "Could not import");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader title="Bulk import" description="Add students, staff or enrollments from a CSV file" />
      {(error || job.error || rows.error) && <Alert type="error">{error || job.error || rows.error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      <Card title="1. Upload a CSV">
        <form onSubmit={preview} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="What are you importing?" htmlFor="import-kind" required>
              <Select id="import-kind" value={kind} onChange={(e) => setKind(e.target.value as ImportKind)}>
                {IMPORT_KINDS.map((k) => <option key={k} value={k}>{formatEnum(k)}</option>)}
              </Select>
            </Field>
            <Field label="CSV file" htmlFor="import-file" required hint="Use the template so the columns match.">
              <Input id="import-file" type="file" accept=".csv,text/csv" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </Field>
          </div>
          {kind !== "enrollments" && (
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={provisionLogins} onChange={(e) => setProvisionLogins(e.target.checked)} />
              Create login accounts for imported {kind}
            </label>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>{busy ? "Checking..." : "Check file"}</Button>
            <Button type="button" variant="outline" asChild>
              <a href={importTemplateUrl(kind)} download>Download {kind} template</a>
            </Button>
          </div>
        </form>
      </Card>

      {currentId && (
        <Card
          title="2. Review and import"
          action={<StatusBadge value={status || null} tones={STATUS_TONES} />}
        >
          <div className="space-y-4">
            {job.loading ? <Loading /> : (
              <NumberStats data={job.data} />
            )}
            <div className="flex flex-wrap gap-2">
              {!done && !failed && <Button disabled={busy || !hash} onClick={commit}>Import valid rows</Button>}
              {failed && hash && <Button disabled={busy} onClick={() => run(() => retryImport(currentId, hash), "Retry started.", "Could not retry")}>Retry failed rows</Button>}
              <Button variant="outline" onClick={() => { job.reload(); rows.reload(); }}>Refresh</Button>
              <Button variant="outline" asChild><a href={importErrorsUrl(currentId)} download>Download errors (CSV)</a></Button>
            </div>

            {rows.loading ? <Loading /> : (rows.data?.items.length ?? 0) === 0 ? <EmptyState>No rows to show.</EmptyState> : (
              <Table>
                <THead><tr><TH>Row</TH><TH>Status</TH><TH>Data</TH><TH>Problems</TH></tr></THead>
                <TBody>
                  {rows.data!.items.map((row, i) => {
                    const values = row.data ?? row.values ?? {};
                    return (
                      <tr key={row.row_number ?? row.row ?? i}>
                        <TD className="tabular-nums">{row.row_number ?? row.row ?? after + i + 1}</TD>
                        <TD><StatusBadge value={row.status ?? (row.errors?.length ? "INVALID" : "VALID")} tones={{ VALID: "green", INVALID: "red", ERROR: "red", IMPORTED: "green", FAILED: "red" }} /></TD>
                        <TD className="max-w-md truncate text-xs text-muted-foreground">{Object.entries(values).map(([k, v]) => `${k}: ${v ?? ""}`).join(" · ")}</TD>
                        <TD className="text-xs text-red-700">{rowErrors(row) || "—"}</TD>
                      </tr>
                    );
                  })}
                </TBody>
              </Table>
            )}
            <div className="flex gap-2">
              {after > 0 && <Button variant="outline" onClick={() => setAfter(Math.max(0, after - 100))}>Previous</Button>}
              {rows.data?.next != null && <Button variant="outline" onClick={() => setAfter(rows.data!.next!)}>Next rows</Button>}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
