"use client";

import { use, useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field, PageHeader, Select } from "@/components/form";
import { Loading } from "@/components/data-display";
import ClassSectionPicker, { type ClassSectionValue } from "@/components/class-section-picker";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { findCreatedId, getId } from "@/lib/api";
import { generateInvoice, listFeeStructures, listInvoices, structureTotal, suggestInvoiceNumber } from "@/lib/fees";
import { getEnrollmentHistory, getRoster, getStudent, studentLabel } from "@/lib/students";
import { cn, formatCurrency, fromDateInput, getErrorMessage, toDateInput } from "@/lib/utils";

type Mode = "single" | "section";
type BulkResult = { created: number; skipped: number; failed: { name: string; error: string }[] };

export default function GenerateInvoicesPage({ searchParams }: { searchParams: Promise<{ student?: string }> }) {
  const { student: fixedStudentId } = use(searchParams);
  const router = useRouter();
  const { years, defaultYearId } = useAcademicYears();

  const [mode, setMode] = useState<Mode>("single");

  // When opened from a student's profile, prefill their class/section from enrollment
  const fixedStudent = useQuery(fixedStudentId ? `invoice-student:${fixedStudentId}` : null, async () => ({
    student: await getStudent(fixedStudentId!),
    enrollments: await getEnrollmentHistory(fixedStudentId!).catch(() => []),
  }));
  const [manualPicker, setManualPicker] = useState<ClassSectionValue | null>(null);
  const enrollment =
    fixedStudent.data?.enrollments.find((e) => e.academic_year_id === defaultYearId) ?? fixedStudent.data?.enrollments.at(-1);
  const picker: ClassSectionValue = manualPicker ?? {
    year: enrollment?.academic_year_id ?? defaultYearId,
    class: enrollment?.class_id ?? "",
    section: enrollment?.section_id ?? "",
  };

  const structures = useQuery(picker.year && picker.class ? `structures:${picker.year}:${picker.class}` : null, () =>
    listFeeStructures({ academic_year_id: picker.year, class_id: picker.class })
  );
  const roster = useQuery(
    picker.year && picker.class && picker.section ? `roster:${picker.year}:${picker.class}:${picker.section}` : null,
    () => getRoster(picker.year, picker.class, picker.section)
  );

  const [structureChoice, setStructureChoice] = useState("");
  const structureId = structureChoice || (structures.data?.[0] ? getId(structures.data[0]) : "");
  const structure = structures.data?.find((s) => getId(s) === structureId);

  const [studentChoice, setStudentChoice] = useState("");
  const studentId = fixedStudentId || studentChoice;
  const [invoiceNumber, setInvoiceNumber] = useState(() => suggestInvoiceNumber());
  const [discount, setDiscount] = useState("0");
  const [fine, setFine] = useState("0");
  const [dueDateChoice, setDueDateChoice] = useState<string | null>(null);
  const dueDate = dueDateChoice ?? toDateInput(structure?.due_date);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState<string>("");
  const [result, setResult] = useState<BulkResult | null>(null);

  const amount = structure ? structureTotal(structure) - (Number(discount) || 0) + (Number(fine) || 0) : 0;

  const baseInvoice = () => ({
    fee_structure_id: structureId,
    academic_year_id: picker.year,
    discount: Number(discount) || 0,
    fine: Number(fine) || 0,
    due_date: dueDate ? fromDateInput(dueDate) : null,
  });

  const handleSingle = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!studentId || !structureId) return;
    setBusy(true);
    setError("");
    try {
      const res = await generateInvoice({ ...baseInvoice(), student_id: studentId, invoice_number: invoiceNumber.trim() });
      const invoiceId = findCreatedId(res);
      router.push(invoiceId ? `/dashboard/fees/invoices/${invoiceId}` : `/dashboard/fees/invoices?year=${picker.year}`);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to generate invoice"));
      setBusy(false);
    }
  };

  const handleSection = async (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const students = roster.data ?? [];
    if (!structureId || students.length === 0) return;
    if (!window.confirm(`Generate invoices for ${students.length} students? Students already invoiced for this fee structure are skipped.`)) return;

    setBusy(true);
    setError("");
    setResult(null);
    const outcome: BulkResult = { created: 0, skipped: 0, failed: [] };
    try {
      const existing = await listInvoices({ academic_year_id: picker.year });
      const alreadyInvoiced = new Set(existing.filter((i) => i.fee_structure_id === structureId).map((i) => i.student_id));

      for (const [index, entry] of students.entries()) {
        setProgress(`Generating ${index + 1} of ${students.length}...`);
        if (alreadyInvoiced.has(entry.studentId)) {
          outcome.skipped++;
          continue;
        }
        try {
          await generateInvoice({
            ...baseInvoice(),
            student_id: entry.studentId,
            invoice_number: suggestInvoiceNumber(entry.student.admission_number),
          });
          outcome.created++;
        } catch (err) {
          outcome.failed.push({ name: studentLabel(entry.student), error: getErrorMessage(err) });
        }
      }
      setResult(outcome);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to check existing invoices"));
    } finally {
      setProgress("");
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-4">
      <PageHeader
        title="Generate invoices"
        description={fixedStudent.data ? `For ${studentLabel(fixedStudent.data.student)}` : "Bill a student or a whole section from a fee structure"}
        backHref={fixedStudentId ? `/dashboard/students/${fixedStudentId}` : "/dashboard/fees/invoices"}
      />

      {!fixedStudentId && (
        <div className="inline-flex rounded-md border bg-card p-1" role="tablist">
          {(["single", "section"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => {
                setMode(m);
                setResult(null);
                setError("");
              }}
              className={cn("rounded px-3 py-1.5 text-sm font-medium", mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
            >
              {m === "single" ? "One student" : "Whole section"}
            </button>
          ))}
        </div>
      )}

      {fixedStudent.loading ? (
        <Loading />
      ) : (
        <form onSubmit={mode === "single" ? handleSingle : handleSection} className="space-y-6 rounded-lg border bg-card p-4 sm:p-6">
          <Field label="Class & section" htmlFor="picker-year" required>
            <ClassSectionPicker
              years={years}
              value={picker}
              onChange={(v) => {
                setManualPicker(v);
                setStructureChoice("");
                setStudentChoice("");
              }}
            />
          </Field>

          {mode === "single" && !fixedStudentId && (
            <Field label="Student" htmlFor="invoice-student" required>
              <Select id="invoice-student" required value={studentChoice} onChange={(e) => setStudentChoice(e.target.value)} disabled={!roster.data}>
                <option value="" disabled>{roster.loading ? "Loading students..." : picker.section ? "Select student" : "Select a section first"}</option>
                {roster.data?.map((r) => (
                  <option key={r.studentId} value={r.studentId}>
                    {r.rollNumber ? `${r.rollNumber}. ` : ""}{studentLabel(r.student)}
                  </option>
                ))}
              </Select>
            </Field>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Fee structure" htmlFor="invoice-structure" required className="sm:col-span-2">
              <Select id="invoice-structure" required value={structureId} onChange={(e) => setStructureChoice(e.target.value)} disabled={!structures.data?.length}>
                {!structures.data?.length && (
                  <option value="">{structures.loading ? "Loading..." : picker.class ? "No fee structures for this class" : "Select a class first"}</option>
                )}
                {structures.data?.map((s) => (
                  <option key={getId(s)} value={getId(s)}>{s.name} — {formatCurrency(structureTotal(s))}</option>
                ))}
              </Select>
              {picker.class && structures.data?.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  <Link href={`/dashboard/fees/structures/new?year=${picker.year}`} className="underline">Create a fee structure</Link> for this class first.
                </p>
              )}
            </Field>
            {mode === "single" && (
              <Field label="Invoice number" htmlFor="invoice-number" required>
                <Input id="invoice-number" required className="font-mono" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} />
              </Field>
            )}
            <Field label="Due date" htmlFor="invoice-due">
              <Input id="invoice-due" type="date" value={dueDate} onChange={(e) => setDueDateChoice(e.target.value)} />
            </Field>
            <Field label="Discount (₹)" htmlFor="invoice-discount">
              <Input id="invoice-discount" type="number" min={0} step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </Field>
            <Field label="Fine (₹)" htmlFor="invoice-fine">
              <Input id="invoice-fine" type="number" min={0} step="0.01" value={fine} onChange={(e) => setFine(e.target.value)} />
            </Field>
          </div>

          {structure && (
            <p className="text-sm">
              Amount per invoice: <span className="text-lg font-semibold">{formatCurrency(amount)}</span>
              {mode === "section" && roster.data && <span className="text-muted-foreground"> · {roster.data.length} students in section</span>}
            </p>
          )}

          {error && <Alert type="error">{error}</Alert>}
          {result && (
            <Alert type={result.failed.length ? "error" : "success"}>
              <p>
                Created {result.created} invoice{result.created === 1 ? "" : "s"}
                {result.skipped ? `, skipped ${result.skipped} already invoiced` : ""}
                {result.failed.length ? `, ${result.failed.length} failed` : ""}.
              </p>
              {result.failed.length > 0 && (
                <ul className="mt-1 list-disc pl-5">
                  {result.failed.map((f) => <li key={f.name}>{f.name}: {f.error}</li>)}
                </ul>
              )}
              <Link href={`/dashboard/fees/invoices?year=${picker.year}`} className="mt-1 inline-block font-medium underline">View invoices</Link>
            </Alert>
          )}

          <div className="flex items-center justify-end gap-3">
            {progress && <span className="text-sm text-muted-foreground">{progress}</span>}
            <Button type="submit" disabled={busy || !structureId || (mode === "single" ? !studentId : !roster.data?.length)}>
              {busy ? "Working..." : mode === "single" ? "Generate invoice" : "Generate for section"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
