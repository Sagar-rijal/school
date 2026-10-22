"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { Alert, Field, Select } from "@/components/form";
import { Card, EmptyState, Loading } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@/hooks/use-query";
import { changeSalary, getCurrentSalary, getSalaryHistory } from "@/lib/staff";
import { PAY_FREQUENCIES, type PayFrequency } from "@/lib/types/staff";
import { formatCurrency, formatDate, formatEnum, fromDateInput, getErrorMessage, todayInput } from "@/lib/utils";

export default function SalaryCard({ staffId, canUpdate }: { staffId: string; canUpdate: boolean }) {
  const current = useQuery(`salary:${staffId}`, () => getCurrentSalary(staffId));
  const [cursors, setCursors] = useState<(string | undefined)[]>([undefined]);
  const after = cursors[cursors.length - 1];
  const history = useQuery(`salary-history:${staffId}:${after ?? "first"}`, () => getSalaryHistory(staffId, after));
  const [amount, setAmount] = useState<string | null>(null);
  const [frequency, setFrequency] = useState<PayFrequency | null>(null);
  const [effectiveDate, setEffectiveDate] = useState(todayInput());
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const salary = current.data;

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const value = Number(amount ?? salary?.amount ?? "");
    if (!Number.isFinite(value) || value < 0 || (amount ?? salary?.amount ?? "") === "") {
      setError("Enter a valid salary amount.");
      return;
    }
    if (salary && salary.amount !== undefined && typeof salary.revision !== "number") {
      setError("The server did not provide the salary revision needed to make a safe change.");
      return;
    }
    if (reason.trim().length < 3) {
      setError("Enter a reason of at least 3 characters.");
      return;
    }

    setBusy(true);
    try {
      await changeSalary(staffId, {
        amount: value,
        currency: "INR",
        frequency: frequency ?? salary?.frequency ?? "MONTHLY",
        effective_at: fromDateInput(effectiveDate),
        reason: reason.trim(),
        expected_revision: salary?.revision ?? 0,
      });
      setMessage("Salary updated.");
      setAmount(null);
      setReason("");
      current.reload();
      history.reload();
    } catch (err) {
      setError(getErrorMessage(err, "Could not change salary"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card title="Salary">
      <div className="space-y-5">
        {(current.error || history.error || error) && <Alert type="error">{current.error || history.error || error}</Alert>}
        {message && <Alert type="success">{message}</Alert>}
        {current.loading ? <Loading /> : salary ? (
          <div className="text-sm">
            <p className="text-muted-foreground">Current salary</p>
            <p className="text-xl font-semibold">{formatCurrency(Number(salary.amount ?? 0))} <span className="text-sm font-normal text-muted-foreground">/ {formatEnum(salary.frequency ?? "MONTHLY")}</span></p>
            {salary.effective_at && <p className="text-muted-foreground">Effective {formatDate(salary.effective_at)}</p>}
          </div>
        ) : <p className="text-sm text-muted-foreground">No salary has been recorded yet.</p>}

        {canUpdate && !current.loading && !current.error && (
          <form onSubmit={submit} className="space-y-4 border-t pt-5">
            <h3 className="font-medium">{salary ? "Change salary" : "Set salary"}</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Amount (₹)" htmlFor={`salary-amount-${staffId}`} required>
                <Input id={`salary-amount-${staffId}`} type="number" min="0" step="0.01" required value={amount ?? String(salary?.amount ?? "")} onChange={(e) => setAmount(e.target.value)} />
              </Field>
              <Field label="Frequency" htmlFor={`salary-frequency-${staffId}`} required>
                <Select id={`salary-frequency-${staffId}`} value={frequency ?? salary?.frequency ?? "MONTHLY"} onChange={(e) => setFrequency(e.target.value as PayFrequency)}>
                  {PAY_FREQUENCIES.map((item) => <option key={item} value={item}>{formatEnum(item)}</option>)}
                </Select>
              </Field>
              <Field label="Effective date" htmlFor={`salary-date-${staffId}`} required>
                <Input id={`salary-date-${staffId}`} type="date" required value={effectiveDate} onChange={(e) => setEffectiveDate(e.target.value)} />
              </Field>
            </div>
            <Field label="Reason" htmlFor={`salary-reason-${staffId}`} required>
              <textarea id={`salary-reason-${staffId}`} required minLength={3} maxLength={1000} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} className="w-full rounded-md border border-input bg-transparent p-3 text-sm" />
            </Field>
            <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save salary"}</Button>
          </form>
        )}

        <div className="space-y-3 border-t pt-5">
          <h3 className="font-medium">History</h3>
          {history.loading ? <Loading /> : history.data?.items.length === 0 && !history.error ? <EmptyState>No salary changes yet.</EmptyState> : (
            <ul className="divide-y rounded-md border text-sm">
              {history.data?.items.map((item, index) => (
                <li key={item.id ?? item._id ?? index} className="flex flex-wrap items-center justify-between gap-2 p-3">
                  <span className="font-medium">{formatCurrency(Number(item.amount ?? 0))} / {formatEnum(item.frequency ?? "MONTHLY")}</span>
                  <span className="text-muted-foreground">{formatDate(item.effective_at ?? item.created_at)}</span>
                  {item.reason && <span className="w-full text-muted-foreground">{item.reason}</span>}
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-2">
            {cursors.length > 1 && <Button type="button" size="sm" variant="outline" onClick={() => setCursors((old) => old.slice(0, -1))}>Previous</Button>}
            {history.data?.next && <Button type="button" size="sm" variant="outline" onClick={() => setCursors((old) => [...old, history.data!.next!])}>Next</Button>}
          </div>
        </div>
      </div>
    </Card>
  );
}
