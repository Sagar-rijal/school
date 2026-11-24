"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import FamilyPage, { type FamilyContext } from "@/components/family/family-page";
import { Alert, Field, Select } from "@/components/form";
import { Card, EmptyState, Loading, NumberStats, StatusBadge } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import {
  getStudentFeeSummary,
  invoiceAmounts,
  listFeeNotifications,
  listPaymentsByStudent,
  listStudentInvoices,
  listStudentPaymentSubmissions,
  markFeeNotificationRead,
  submitPaymentEvidence,
} from "@/lib/fees";
import { fileContentUrl, uploadFile } from "@/lib/files";
import { INVOICE_STATUS_TONES, PAYMENT_MODES, type FeeInvoice } from "@/lib/types/fees";
import { cn, emptyToNull, formatCurrency, formatDate, formatEnum, fromDateInput, getErrorMessage, todayInput } from "@/lib/utils";

const SUBMISSION_TONES = { PENDING: "yellow", SUBMITTED: "yellow", APPROVED: "green", REJECTED: "red" } as const;

function ProofForm({ invoice, studentId, onDone, onCancel }: { invoice: FeeInvoice; studentId: string; onDone: () => void; onCancel: () => void }) {
  const balance = invoiceAmounts(invoice).balance;
  const [amount, setAmount] = useState(balance ? String(balance) : "");
  const [mode, setMode] = useState<string>("UPI");
  const [date, setDate] = useState(todayInput());
  const [reference, setReference] = useState("");
  const [remarks, setRemarks] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); setError("");
    const paid = Number(amount);
    if (!(paid > 0)) { setError("Enter the amount you paid."); return; }
    if (balance && paid > balance) { setError(`The amount can't be more than the balance (${formatCurrency(balance)}).`); return; }
    if (!file) { setError("Attach a screenshot or photo of the payment receipt."); return; }
    setBusy(true);
    try {
      const proofId = await uploadFile(file, "payment_proof", studentId);
      await submitPaymentEvidence({
        student_id: studentId, invoice_id: getId(invoice), proof_file_id: proofId, amount_paid: paid, payment_mode: mode,
        payment_date: fromDateInput(date), transaction_reference: emptyToNull(reference), remarks: emptyToNull(remarks),
      });
      onDone();
    } catch (err) { setError(getErrorMessage(err, "Could not send payment proof")); }
    finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-md border bg-muted/30 p-3">
      <p className="text-sm text-muted-foreground">Paid outside school (UPI, bank transfer…)? Send the proof and the office will confirm it.</p>
      {error && <Alert type="error">{error}</Alert>}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Amount paid (₹)" htmlFor="proof-amount" required><Input id="proof-amount" type="number" min={0.01} step={0.01} required value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
        <Field label="Paid by" htmlFor="proof-mode"><Select id="proof-mode" value={mode} onChange={(e) => setMode(e.target.value)}>{PAYMENT_MODES.map((m) => <option key={m} value={m}>{formatEnum(m)}</option>)}</Select></Field>
        <Field label="Payment date" htmlFor="proof-date" required><Input id="proof-date" type="date" required max={todayInput()} value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        <Field label="Transaction / UTR no." htmlFor="proof-ref"><Input id="proof-ref" maxLength={120} value={reference} onChange={(e) => setReference(e.target.value)} /></Field>
        <Field label="Receipt / screenshot" htmlFor="proof-file" required className="sm:col-span-2"><Input id="proof-file" type="file" accept="image/*,application/pdf" required onChange={(e) => setFile(e.target.files?.[0] ?? null)} /></Field>
      </div>
      <Field label="Note for the office" htmlFor="proof-remarks"><Input id="proof-remarks" maxLength={500} value={remarks} onChange={(e) => setRemarks(e.target.value)} /></Field>
      <div className="flex gap-2">
        <Button type="submit" disabled={busy}>{busy ? "Sending..." : "Send proof"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

function Fees({ child }: FamilyContext) {
  const id = child.studentId;
  const summary = useQuery(`fee-summary:${id}`, () => getStudentFeeSummary(id));
  const invoices = useQuery(`student-invoices:${id}`, () => listStudentInvoices(id));
  const payments = useQuery(`student-payments:${id}`, () => listPaymentsByStudent(id));
  const submissions = useQuery(`student-payment-submissions:${id}`, () => listStudentPaymentSubmissions(id));
  const alerts = useQuery(`fee-alerts:${id}`, () => listFeeNotifications());
  const [paying, setPaying] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const pendingFor = (invoiceId: string) =>
    submissions.data?.items.some((s) => s.invoice_id === invoiceId && ["PENDING", "SUBMITTED", undefined].includes(s.status?.toUpperCase()));
  const sortedInvoices = [...(invoices.data ?? [])].sort((a, b) => (b.due_date ?? "").localeCompare(a.due_date ?? ""));
  const loadError = summary.error || invoices.error || payments.error || submissions.error || alerts.error;

  const readAlert = async (alertId: string) => {
    try { await markFeeNotificationRead(alertId); alerts.reload(); }
    catch (err) { setError(getErrorMessage(err, "Could not mark as read")); }
  };

  return (
    <>
      {(loadError || error) && <Alert type="error">{loadError || error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}

      {(alerts.data?.items ?? []).filter((a) => !a.read_at && !a.is_read).map((a) => (
        <div key={getId(a)} className="flex flex-wrap items-start justify-between gap-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <div><p className="font-medium">{a.title ?? "Fee reminder"}</p>{a.message && <p>{a.message}</p>}</div>
          <Button size="sm" variant="outline" onClick={() => readAlert(getId(a))}>Dismiss</Button>
        </div>
      ))}

      <Card title="Summary">
        {summary.loading ? <Loading /> : <NumberStats data={summary.data} format={(key, value) => (/count|invoices|number/i.test(key) ? value : formatCurrency(value))} />}
      </Card>

      <Card title="Invoices">
        {invoices.loading ? <Loading /> : sortedInvoices.length === 0 ? <EmptyState>No invoices yet.</EmptyState> : (
          <ul className="divide-y rounded-md border text-sm">
            {sortedInvoices.map((inv) => {
              const invId = getId(inv);
              const { total, paid, balance } = invoiceAmounts(inv);
              const overdue = balance > 0 && !!inv.due_date && inv.due_date.slice(0, 10) < todayInput();
              return (
                <li key={invId} className="space-y-3 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-mono text-xs font-medium">{inv.invoice_number}</p>
                      <p className={cn("text-xs", overdue ? "text-red-700" : "text-muted-foreground")}>Due {formatDate(inv.due_date)}{overdue ? " · overdue" : ""} · Total {formatCurrency(total)} · Paid {formatCurrency(paid)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{formatCurrency(balance)} due</span>
                      <StatusBadge value={inv.status ?? "PENDING"} tones={INVOICE_STATUS_TONES} />
                      {balance > 0 && paying !== invId && (
                        pendingFor(invId)
                          ? <span className="text-xs text-muted-foreground">Proof under review</span>
                          : <Button size="sm" onClick={() => { setPaying(invId); setMessage(""); }}>I&apos;ve paid</Button>
                      )}
                    </div>
                  </div>
                  {paying === invId && (
                    <ProofForm invoice={inv} studentId={id} onCancel={() => setPaying("")}
                      onDone={() => { setPaying(""); setMessage("Payment proof sent. The school office will confirm it."); submissions.reload(); }} />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {(submissions.data?.items.length ?? 0) > 0 && (
        <Card title="Payment proofs sent">
          <ul className="divide-y rounded-md border text-sm">
            {submissions.data!.items.map((s, i) => (
              <li key={getId(s) || s.submission_id || i} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <span>
                  <span className="font-medium">{formatCurrency(s.amount_paid)}</span>
                  <span className="text-muted-foreground"> · {formatDate(s.payment_date ?? s.created_at)}{s.payment_mode ? ` · ${formatEnum(s.payment_mode)}` : ""}</span>
                  {s.proof_file_id && <> · <a href={fileContentUrl(s.proof_file_id)} target="_blank" rel="noopener noreferrer" className="text-primary underline">Proof</a></>}
                  {(s.rejection_reason || s.reviewer_remarks) && <span className="block text-xs text-muted-foreground">Office: {s.rejection_reason || s.reviewer_remarks}</span>}
                </span>
                <StatusBadge value={s.status ?? "PENDING"} tones={SUBMISSION_TONES} />
              </li>
            ))}
          </ul>
        </Card>
      )}

      {(payments.data?.length ?? 0) > 0 && (
        <Card title="Receipts">
          <ul className="divide-y rounded-md border text-sm">
            {[...payments.data!].sort((a, b) => b.payment_date.localeCompare(a.payment_date)).map((p) => (
              <li key={getId(p) || p.receipt_number} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                <span><span className="font-mono text-xs">{p.receipt_number}</span><span className="text-muted-foreground"> · {formatDate(p.payment_date)} · {formatEnum(p.payment_mode)}</span></span>
                <span className="font-semibold">{formatCurrency(p.amount_paid)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}

export default function FamilyFeesPage() {
  return <FamilyPage title="Fees" description="Invoices, payments and receipts">{(ctx) => <Fees {...ctx} />}</FamilyPage>;
}
