import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Backend date-time ("2026-04-01T00:00:00") → <input type="date"> value ("2026-04-01"). */
export function toDateInput(value?: string | null) {
  return value ? value.slice(0, 10) : ""
}

/** <input type="date"> value → date-time string the backend accepts. No timezone shift. */
export function fromDateInput(value: string) {
  return `${value}T00:00:00`
}

export function formatDate(value?: string | null) {
  if (!value) return "—"
  const [y, m, d] = value.slice(0, 10).split("-").map(Number)
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

/** "PARTIALLY_PAID" → "Partially paid" */
export function formatEnum(value: string) {
  const text = value.replace(/_/g, " ").toLowerCase()
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function formatCurrency(amount?: number | null) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(amount ?? 0)
}

/** "Priya Sharma" from a record with first_name/last_name. */
export function fullName(person?: { first_name?: string; last_name?: string } | null) {
  return person ? [person.first_name, person.last_name].filter(Boolean).join(" ") : ""
}

/** Today as YYYY-MM-DD in local time (for <input type="date">). */
export function todayInput() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Numbers from inputs: "" → null, otherwise the number. */
export function toNumberOrNull(value: string) {
  return value.trim() === "" ? null : Number(value)
}

/** Empty strings → null, for optional backend fields. */
export function emptyToNull(value: string) {
  const trimmed = value.trim()
  return trimmed === "" ? null : trimmed
}

/** Sort by display_order, then name ("Class 2" before "Class 10"). */
export function byDisplayOrder<T extends { display_order?: number; name: string }>(a: T, b: T) {
  return (
    (a.display_order ?? 0) - (b.display_order ?? 0) ||
    a.name.localeCompare(b.name, undefined, { numeric: true })
  )
}

export function getErrorMessage(err: unknown, fallback = "Something went wrong") {
  return err instanceof Error ? err.message : fallback
}
