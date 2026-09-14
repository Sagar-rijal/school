import { apiRequest, unwrap } from "./api";
import type {
  FeeCategory,
  FeeCategoryPayload,
  FeeInvoice,
  FeeInvoicePayload,
  FeeInvoiceUpdatePayload,
  FeePayment,
  FeePaymentPayload,
  FeeStructure,
  FeeStructurePayload,
  FeeStructureUpdatePayload,
} from "./types/fees";
import { fromDateInput } from "./utils";

// ── Categories ──

export async function listFeeCategories() {
  return unwrap<FeeCategory[]>(await apiRequest("/fees/categories")) ?? [];
}

export function createFeeCategory(payload: FeeCategoryPayload) {
  return apiRequest("/fees/categories", { method: "POST", body: payload });
}

export function updateFeeCategory(id: string, payload: Partial<FeeCategoryPayload>) {
  return apiRequest(`/fees/categories/${id}`, { method: "PUT", body: payload });
}

export function deleteFeeCategory(id: string) {
  return apiRequest(`/fees/categories/${id}`, { method: "DELETE" });
}

// ── Structures ──

export async function listFeeStructures(filters: { academic_year_id?: string; class_id?: string } = {}) {
  return unwrap<FeeStructure[]>(await apiRequest("/fees/structures", { query: filters })) ?? [];
}

export async function getFeeStructure(id: string) {
  return unwrap<FeeStructure>(await apiRequest(`/fees/structures/${id}`));
}

export function createFeeStructure(payload: FeeStructurePayload) {
  return apiRequest("/fees/structures", { method: "POST", body: payload });
}

export function updateFeeStructure(id: string, payload: FeeStructureUpdatePayload) {
  return apiRequest(`/fees/structures/${id}`, { method: "PUT", body: payload });
}

export function deleteFeeStructure(id: string) {
  return apiRequest(`/fees/structures/${id}`, { method: "DELETE" });
}

/** Backend computes the total, but fall back to summing line items. */
export function structureTotal(structure: FeeStructure) {
  return structure.total_amount ?? structure.line_items?.reduce((sum, item) => sum + (item.amount || 0), 0) ?? 0;
}

// ── Invoices ──

export async function listInvoices(filters: { academic_year_id?: string; status?: string } = {}) {
  return unwrap<FeeInvoice[]>(await apiRequest("/fees/invoices", { query: filters })) ?? [];
}

export async function getInvoice(id: string) {
  return unwrap<FeeInvoice>(await apiRequest(`/fees/invoices/${id}`));
}

export function generateInvoice(payload: FeeInvoicePayload) {
  return apiRequest("/fees/invoices", { method: "POST", body: payload });
}

export function updateInvoice(id: string, payload: FeeInvoiceUpdatePayload) {
  return apiRequest(`/fees/invoices/${id}`, { method: "PUT", body: payload });
}

export async function listStudentInvoices(studentId: string, status?: string) {
  return unwrap<FeeInvoice[]>(await apiRequest(`/fees/invoices/student/${studentId}`, { query: { status } })) ?? [];
}

/** Amounts with fallbacks when the backend omits computed fields. */
export function invoiceAmounts(invoice: FeeInvoice, structure?: FeeStructure) {
  const total = invoice.total_amount ?? (structure ? structureTotal(structure) : 0);
  const discount = invoice.discount ?? 0;
  const fine = invoice.fine ?? 0;
  const paid = invoice.paid_amount ?? 0;
  const balance = invoice.balance_due ?? Math.max(0, total - discount + fine - paid);
  return { total, discount, fine, paid, balance };
}

// ── Payments ──

export function collectPayment(payload: FeePaymentPayload) {
  return apiRequest("/fees/payments", { method: "POST", body: payload });
}

export async function listPaymentsByInvoice(invoiceId: string) {
  return unwrap<FeePayment[]>(await apiRequest(`/fees/payments/invoice/${invoiceId}`)) ?? [];
}

export async function listPaymentsByStudent(studentId: string) {
  return unwrap<FeePayment[]>(await apiRequest(`/fees/payments/student/${studentId}`)) ?? [];
}

export async function listPaymentsInRange(fromDate: string, toDate: string) {
  const res = await apiRequest("/fees/payments/range", {
    query: { from_date: fromDateInput(fromDate), to_date: `${toDate}T23:59:59` },
  });
  return unwrap<FeePayment[]>(res) ?? [];
}

// ── Reports ──

/** Totals invoiced/paid/discount/fine/balance and pending/overdue counts. Shape isn't documented. */
export async function getStudentFeeSummary(studentId: string) {
  return unwrap<unknown>(await apiRequest(`/fees/report/student/${studentId}`));
}

// ── Numbering ──

const stamp = () => {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
};
const suffix = () => Math.random().toString(36).slice(2, 6).toUpperCase();

/** Suggested invoice number, e.g. INV-20260914-ADM102-7K3Q (editable before saving). */
export function suggestInvoiceNumber(admissionNumber?: string) {
  const adm = admissionNumber ? `${admissionNumber.replace(/[^A-Za-z0-9]/g, "").toUpperCase()}-` : "";
  return `INV-${stamp()}-${adm}${suffix()}`;
}

/** Suggested receipt number, e.g. RCPT-20260914-9F2A. The backend rejects duplicates. */
export function suggestReceiptNumber() {
  return `RCPT-${stamp()}-${suffix()}`;
}
