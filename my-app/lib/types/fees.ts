// Mirrors the Fees schemas from the backend OpenAPI spec

export const FEE_FREQUENCIES = ["ONE_TIME", "MONTHLY", "QUARTERLY", "HALF_YEARLY", "ANNUALLY"] as const;
export const INVOICE_STATUSES = ["PENDING", "PARTIALLY_PAID", "PAID", "OVERDUE", "WAIVED"] as const;
export const PAYMENT_MODES = ["CASH", "CHEQUE", "UPI", "BANK_TRANSFER", "CARD", "ONLINE"] as const;

export type FeeFrequency = (typeof FEE_FREQUENCIES)[number];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type PaymentMode = (typeof PAYMENT_MODES)[number];

export const INVOICE_STATUS_TONES = {
  PENDING: "yellow",
  PARTIALLY_PAID: "blue",
  PAID: "green",
  OVERDUE: "red",
  WAIVED: "gray",
} as const;

// ── Categories ──

export type FeeCategoryPayload = {
  name: string;
  code: string;
  description?: string | null;
  is_mandatory: boolean;
};

export type FeeCategory = FeeCategoryPayload & { _id?: string; id?: string };

// ── Structures ──

export type FeeLineItem = {
  category_id: string;
  category_name: string;
  amount: number;
};

export type FeeStructurePayload = {
  academic_year_id: string;
  class_id: string;
  name: string;
  frequency: FeeFrequency;
  line_items: FeeLineItem[];
  due_date?: string | null;
};

/** Year and class can't be changed; the total is recalculated from line items. */
export type FeeStructureUpdatePayload = Partial<Pick<FeeStructurePayload, "name" | "frequency" | "line_items" | "due_date">>;

export type FeeStructure = FeeStructurePayload & {
  _id?: string;
  id?: string;
  /** Computed by the backend. */
  total_amount?: number;
};

// ── Invoices ──

export type FeeInvoicePayload = {
  student_id: string;
  fee_structure_id: string;
  academic_year_id: string;
  invoice_number: string;
  discount: number;
  fine: number;
  due_date?: string | null;
};

export type FeeInvoiceUpdatePayload = {
  discount?: number | null;
  fine?: number | null;
  due_date?: string | null;
  status?: InvoiceStatus | null;
};

/** Amount fields are computed by the backend (names taken from the endpoint descriptions). */
export type FeeInvoice = FeeInvoicePayload & {
  _id?: string;
  id?: string;
  status?: InvoiceStatus;
  total_amount?: number;
  paid_amount?: number;
  balance_due?: number;
};

// ── Payments ──

export type FeePaymentPayload = {
  student_id: string;
  invoice_id: string;
  amount_paid: number;
  payment_mode: PaymentMode;
  transaction_reference?: string | null;
  payment_date: string; // ISO date-time
  remarks?: string | null;
  receipt_number: string;
};

export type FeePayment = FeePaymentPayload & { _id?: string; id?: string };
