"use client";

import { use, useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field, PageHeader, Select } from "@/components/form";
import { Card, DetailList, EmptyState, Loading, StatTile, StatusBadge, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import {
  collectPayment,
  getFeeStructure,
  getInvoice,
  invoiceAmounts,
  listPaymentsByInvoice,
  suggestReceiptNumber,
  updateInvoice,
} from "@/lib/fees";
import { getStudent, studentLabel } from "@/lib/students";
import { INVOICE_STATUS_TONES, INVOICE_STATUSES, PAYMENT_MODES, type InvoiceStatus, type PaymentMode } from "@/lib/types/fees";
import { emptyToNull, formatCurrency, formatDate, formatEnum, fromDateInput, getErrorMessage, toDateInput, todayInput } from "@/lib/utils";

export default function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const lookup = useAcademicLookup();
  const invoice = useQuery(`invoice:${id}`, () => getInvoice(id));
  const inv = invoice.data;

  const structure = useQuery(inv ? `structure:${inv.fee_structure_id}` : null, () => getFeeStructure(inv!.fee_structure_id));
  const student = useQuery(inv ? `student:${inv.student_id}` : null, () => getStudent(inv!.student_id));
  const payments = useQuery(`payments:invoice:${id}`, () => listPaymentsByInvoice(id));

  const amounts = inv ? invoiceAmounts(inv, structure.data) : null;
  const canCollect = !!amounts && amounts.balance > 0 && inv?.status !== "WAIVED" && inv?.status !== "PAID";

  const [notice, setNotice] = useState("");

  const refresh = (message = "") => {
    setNotice(message);
    invoice.reload();
    payments.reload();
  };

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title={inv ? `Invoice ${inv.invoice_number}` : "Invoice"}
        description={student.data ? studentLabel(student.data) : undefined}
        backHref="/dashboard/fees/invoices"
        action={inv && <StatusBadge value={inv.status ?? "PENDING"} tones={INVOICE_STATUS_TONES} />}
      />

      {invoice.error && <Alert type="error">{invoice.error}</Alert>}
      {notice && <Alert type="success">{notice}</Alert>}
      {invoice.loading && <Loading />}

      {inv && amounts && (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <StatTile label="Fee total" value={formatCurrency(amounts.total)} />
            <StatTile label="Discount" value={`− ${formatCurrency(amounts.discount)}`} />
            <StatTile label="Fine" value={`+ ${formatCurrency(amounts.fine)}`} />
            <StatTile label="Paid" value={formatCurrency(amounts.paid)} tone="green" />
            <StatTile label="Balance due" value={formatCurrency(amounts.balance)} tone={amounts.balance > 0 ? "red" : "green"} />
          </div>

          <Card title="Details">
            <DetailList
              items={[
                {
                  label: "Student",
                  value: <Link href={`/dashboard/students/${inv.student_id}`} className="underline">{student.data ? studentLabel(student.data) : "View student"}</Link>,
                },
                { label: "Fee structure", value: structure.data?.name },
                { label: "Academic year", value: lookup.yearName(inv.academic_year_id) },
                { label: "Due date", value: formatDate(inv.due_date) },
              ]}
            />
            {structure.data?.line_items && (
              <ul className="mt-4 divide-y rounded-md border text-sm">
                {structure.data.line_items.map((li) => (
                  <li key={li.category_id} className="flex justify-between px-3 py-2">
                    <span>{li.category_name}</span>
                    <span>{formatCurrency(li.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div className="grid items-start gap-6 lg:grid-cols-2">
            {canCollect ? (
              <CollectPaymentForm
                key={`${amounts.balance}`}
                invoiceId={id}
                studentId={inv.student_id}
                balance={amounts.balance}
                onCollected={refresh}
              />
            ) : (
              <Card title="Collect payment">
                <EmptyState>{inv.status === "WAIVED" ? "This invoice was waived." : "Fully paid — nothing due."}</EmptyState>
              </Card>
            )}
            <AdjustInvoiceForm
              key={`${inv.discount}:${inv.fine}:${inv.due_date}:${inv.status}`}
              invoiceId={id}
              discount={inv.discount}
              fine={inv.fine}
              dueDate={inv.due_date}
              status={inv.status ?? "PENDING"}
              onSaved={() => refresh("Invoice updated.")}
            />
          </div>

          <Card title="Payments">
            {payments.error && <Alert type="error">{payments.error}</Alert>}
            {payments.loading ? (
              <Loading />
            ) : (payments.data ?? []).length === 0 ? (
              <EmptyState>No payments yet.</EmptyState>
            ) : (
              <Table>
                <THead>
                  <tr>
                    <TH>Receipt</TH>
                    <TH>Date</TH>
                    <TH>Mode</TH>
                    <TH>Reference</TH>
                    <TH>Remarks</TH>
                    <TH className="text-right">Amount</TH>
                  </tr>
                </THead>
                <TBody>
                  {[...payments.data!].sort((a, b) => b.payment_date.localeCompare(a.payment_date)).map((p) => (
                    <tr key={getId(p) || p.receipt_number}>
                      <TD className="font-mono text-xs">{p.receipt_number}</TD>
                      <TD>{formatDate(p.payment_date)}</TD>
                      <TD>{formatEnum(p.payment_mode)}</TD>
                      <TD>{p.transaction_reference || "—"}</TD>
                      <TD className="text-muted-foreground">{p.remarks || "—"}</TD>
                      <TD className="text-right font-semibold">{formatCurrency(p.amount_paid)}</TD>
                    </tr>
                  ))}
                </TBody>
              </Table>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

function CollectPaymentForm({ invoiceId, studentId, balance, onCollected }: { invoiceId: string; studentId: string; balance: number; onCollected: (message: string) => void }) {
  const [amount, setAmount] = useState(String(balance));
  const [mode, setMode] = useState<PaymentMode>("CASH");
  const [date, setDate] = useState(todayInput());
  const [reference, setReference] = useState("");
  const [receipt, setReceipt] = useState(() => suggestReceiptNumber());
  const [remarks, setRemarks] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = Number(amount);
    if (!(value > 0) || value > balance) {
      setError(`Amount must be between ₹1 and the balance of ${formatCurrency(balance)}.`);
      return;
    }
    setBusy(true);
    setError("");
    try {
      await collectPayment({
        student_id: studentId,
        invoice_id: invoiceId,
        amount_paid: value,
        payment_mode: mode,
        transaction_reference: emptyToNull(reference),
        payment_date: fromDateInput(date),
        remarks: emptyToNull(remarks),
        receipt_number: receipt.trim(),
      });
      // The form remounts with the new balance, so the confirmation is shown by the page
      onCollected(`Collected ${formatCurrency(value)} — receipt ${receipt.trim()}.`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to record payment"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Collect payment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Amount (₹)" htmlFor="pay-amount" required hint={`Balance ${formatCurrency(balance)}`}>
            <Input id="pay-amount" type="number" required min={1} max={balance} step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="Mode" htmlFor="pay-mode" required>
            <Select id="pay-mode" value={mode} onChange={(e) => setMode(e.target.value as PaymentMode)}>
              {PAYMENT_MODES.map((m) => <option key={m} value={m}>{formatEnum(m)}</option>)}
            </Select>
          </Field>
          <Field label="Payment date" htmlFor="pay-date" required>
            <Input id="pay-date" type="date" required max={todayInput()} value={date} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field label="Receipt number" htmlFor="pay-receipt" required>
            <Input id="pay-receipt" required className="font-mono" value={receipt} onChange={(e) => setReceipt(e.target.value)} />
          </Field>
          {mode !== "CASH" && (
            <Field label="Transaction / cheque reference" htmlFor="pay-ref" className="sm:col-span-2">
              <Input id="pay-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
            </Field>
          )}
          <Field label="Remarks" htmlFor="pay-remarks" className="sm:col-span-2">
            <Input id="pay-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </Field>
        </div>
        {error && <Alert type="error">{error}</Alert>}
        <div className="flex justify-end">
          <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Record payment"}</Button>
        </div>
      </form>
    </Card>
  );
}

function AdjustInvoiceForm({
  invoiceId,
  discount,
  fine,
  dueDate,
  status,
  onSaved,
}: {
  invoiceId: string;
  discount?: number;
  fine?: number;
  dueDate?: string | null;
  status: InvoiceStatus;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({ discount: String(discount ?? 0), fine: String(fine ?? 0), dueDate: toDateInput(dueDate), status });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await updateInvoice(invoiceId, {
        discount: Number(form.discount) || 0,
        fine: Number(form.fine) || 0,
        due_date: form.dueDate ? fromDateInput(form.dueDate) : null,
        status: form.status,
      });
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update invoice"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Adjust invoice">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Discount (₹)" htmlFor="adj-discount">
            <Input id="adj-discount" type="number" min={0} step="0.01" value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />
          </Field>
          <Field label="Fine (₹)" htmlFor="adj-fine">
            <Input id="adj-fine" type="number" min={0} step="0.01" value={form.fine} onChange={(e) => setForm({ ...form, fine: e.target.value })} />
          </Field>
          <Field label="Due date" htmlFor="adj-due">
            <Input id="adj-due" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          </Field>
          <Field label="Status" htmlFor="adj-status" hint="Paid/partially paid update automatically with payments">
            <Select id="adj-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as InvoiceStatus })}>
              {INVOICE_STATUSES.map((s) => <option key={s} value={s}>{formatEnum(s)}</option>)}
            </Select>
          </Field>
        </div>
        {error && <Alert type="error">{error}</Alert>}
        <div className="flex justify-end">
          <Button type="submit" variant="outline" disabled={busy}>{busy ? "Saving..." : "Save adjustments"}</Button>
        </div>
      </form>
    </Card>
  );
}
