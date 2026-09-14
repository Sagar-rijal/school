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
