import { apiRequest, unwrap, unwrapPage } from "./api";
import type {
  FeeCategory,
  FeeCategoryPayload,
  FeeInvoice,
  FeeInvoicePayload,
  FeeInvoiceUpdatePayload,
  FeePayment,
  FeePaymentPayload,
  PaymentSubmission,
  FeeStructure,
  FeeStructurePayload,
  FeeStructureUpdatePayload,
} from "./types/fees";
import { fromDateInput } from "./utils";

// ── Categories ──

export async function listFeeCategories() {
  return unwrap<FeeCategory[]>(await apiRequest("/fees/categories")) ?? [];
}

export async function getFeeCategory(id: string) {
  return unwrap<FeeCategory>(await apiRequest(`/fees/categories/${id}`));
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

// ── Payment evidence submitted for review ──

export async function listPendingPaymentSubmissions(after?: string) {
  return unwrapPage<PaymentSubmission>(
    await apiRequest("/fees/payment-submissions/pending", { query: { limit: 50, after } })
  );
}

export async function listStudentPaymentSubmissions(studentId: string, after?: string) {
  return unwrapPage<PaymentSubmission>(
    await apiRequest(`/fees/payment-submissions/student/${encodeURIComponent(studentId)}`, { query: { limit: 50, after } })
  );
}

/** Family-side: upload proof first (see uploadFile), then submit it for review. Does not settle the invoice. */
export function submitPaymentEvidence(payload: {
  student_id: string;
  invoice_id: string;
  proof_file_id: string;
  amount_paid: number;
  payment_mode: string;
  payment_date: string;
  transaction_reference?: string | null;
  remarks?: string | null;
}) {
  return apiRequest("/fees/payment-submissions", { method: "POST", body: payload, headers: { "Idempotency-Key": crypto.randomUUID() } });
}

export async function getPaymentSubmission(id: string) {
  return unwrap<PaymentSubmission>(await apiRequest(`/fees/payment-submissions/${encodeURIComponent(id)}`));
}

export async function reviewPaymentSubmission(id: string, decision: "approve" | "reject", reason?: string) {
  return apiRequest(`/fees/payment-submissions/${encodeURIComponent(id)}/${decision}`, {
    method: "POST",
    body: { reason: reason || null },
  });
}

// ── Reports ──

/** Totals invoiced/paid/discount/fine/balance and pending/overdue counts. Shape isn't documented. */
export async function getStudentFeeSummary(studentId: string) {
  return unwrap<unknown>(await apiRequest(`/fees/report/student/${studentId}`));
}

export type OutstandingFeeRow = {
  id?: string;
  _id?: string;
  student_id?: string;
  student_name?: string;
  admission_number?: string;
  invoice_id?: string;
  invoice_number?: string;
  due_date?: string;
  amount_due?: number;
  balance_due?: number;
  outstanding_amount?: number;
  total_outstanding?: number;
};

export async function getOutstandingFeeReport(filters: {
  academic_year_id?: string;
  class_id?: string;
  as_of?: string;
  after?: string;
}) {
  return unwrapPage<OutstandingFeeRow>(await apiRequest("/fees/report/outstanding", { query: { ...filters, limit: 50 } }));
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

// ── Miscellaneous charges (one-off fees for chosen students) ──

export function createMiscellaneousCharges(payload: {
  academic_year_id: string;
  class_id: string;
  student_ids: string[];
  description: string;
  amount: number;
  due_date?: string | null;
}) {
  return apiRequest("/fees/miscellaneous-charges", { method: "POST", body: payload, headers: { "Idempotency-Key": crypto.randomUUID() } });
}

// ── Due-fee reminders ──

export type DueNoticePreview = {
  student_id?: string;
  student_name?: string;
  invoice_count?: number;
  total_due?: number;
  balance_due?: number;
  recipients?: unknown[];
  [key: string]: unknown;
};

/** due_before is a YYYY-MM-DD date input value. */
export async function previewDueNotice(studentIds: string[], dueBefore: string) {
  return unwrap<unknown>(await apiRequest("/fees/notices/preview-due", {
    method: "POST",
    body: { student_ids: studentIds, due_before: `${dueBefore}T23:59:59` },
  }));
}

export function sendDueNotice(studentIds: string[], dueBefore: string) {
  return apiRequest("/fees/notices/send-due", {
    method: "POST",
    body: { student_ids: studentIds, due_before: `${dueBefore}T23:59:59` },
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });
}

// ── Fee notifications (family inbox) ──

export type FeeNotification = { id?: string; _id?: string; title?: string; message?: string; created_at?: string; read_at?: string | null; is_read?: boolean };

export async function listFeeNotifications(unreadOnly = false, after?: string) {
  return unwrapPage<FeeNotification>(await apiRequest("/fees/notifications/inbox", { query: { limit: 50, after, unread_only: unreadOnly } }));
}

export function markFeeNotificationRead(id: string) {
  return apiRequest(`/fees/notifications/inbox/${encodeURIComponent(id)}/read`, { method: "POST" });
}

// ── Fee statement exports (generated in the background) ──

export type FeeStatementExport = {
  id?: string;
  _id?: string;
  export_id?: string;
  status?: string;
  file_id?: string | null;
  download_url?: string | null;
  error?: string | null;
  created_at?: string;
};

export async function createFeeStatementExport(filters: { student_id?: string; academic_year_id?: string; class_id?: string; due_before?: string }) {
  const res = await apiRequest("/fees/report/exports", {
    method: "POST",
    body: {
      student_id: filters.student_id || null,
      academic_year_id: filters.academic_year_id || null,
      class_id: filters.class_id || null,
      due_before: filters.due_before ? `${filters.due_before}T23:59:59` : null,
    },
    headers: { "Idempotency-Key": crypto.randomUUID() },
  });
  return unwrap<FeeStatementExport>(res);
}

export async function getFeeStatementExport(exportId: string) {
  return unwrap<FeeStatementExport>(await apiRequest(`/fees/report/exports/${encodeURIComponent(exportId)}`));
}
