import * as React from "react";
import { cn, formatEnum } from "@/lib/utils";

/** Scrollable table wrapper — tables may be wider than a phone screen. */
export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("overflow-x-auto rounded-lg border bg-white", className)}>
      <table className="w-full min-w-max text-sm">{children}</table>
    </div>
  );
}

export function THead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">{children}</thead>;
}

export function TH({ className, children }: { className?: string; children?: React.ReactNode }) {
  return <th className={cn("px-4 py-2.5 font-medium", className)}>{children}</th>;
}

export function TBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y">{children}</tbody>;
}

export function TD({ className, children, colSpan }: { className?: string; children?: React.ReactNode; colSpan?: number }) {
  return (
    <td colSpan={colSpan} className={cn("px-4 py-3 align-middle", className)}>
      {children}
    </td>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">{children}</div>;
}

export function Loading({ children = "Loading..." }: { children?: React.ReactNode }) {
  return <p className="text-sm text-muted-foreground">{children}</p>;
}

const TONES = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  gray: "bg-gray-100 text-gray-700",
} as const;

export type Tone = keyof typeof TONES;

/** Pill for enum statuses. Pass a tone map so each feature decides its own colours. */
export function StatusBadge({ value, tones }: { value?: string | null; tones?: Partial<Record<string, Tone>> }) {
  if (!value) return <span className="text-muted-foreground">—</span>;
  const tone = tones?.[value] ?? "gray";
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap", TONES[tone])}>
      {formatEnum(value)}
    </span>
  );
}

/** Label/value pairs for detail pages. */
export function DetailList({ items }: { items: { label: string; value?: React.ReactNode }[] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div key={item.label} className="min-w-0">
          <dt className="text-xs uppercase tracking-wide text-muted-foreground">{item.label}</dt>
          <dd className="truncate text-sm">{item.value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Card({ title, action, children, className }: { title?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-lg border bg-white p-4 sm:p-5", className)}>
      {(title || action) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * Shows the numeric fields of a report object as tiles. Report endpoints don't document
 * their response, so this adapts to whatever counts/percentages come back.
 */
export function NumberStats({ data, format }: { data: unknown; format?: (key: string, value: number) => React.ReactNode }) {
  const source = data && typeof data === "object" && !Array.isArray(data) ? (data as Record<string, unknown>) : {};
  const entries = Object.entries(source).filter((entry): entry is [string, number] => typeof entry[1] === "number");
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">No summary available.</p>;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {entries.map(([key, value]) => (
        <StatTile
          key={key}
          label={formatEnum(key)}
          value={format ? format(key, value) : /percent/i.test(key) ? `${Math.round(value * 10) / 10}%` : value}
        />
      ))}
    </div>
  );
}

export function StatTile({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "red" | "green" }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className={cn("text-lg font-semibold", tone === "red" && "text-red-700", tone === "green" && "text-green-700")}>{value}</p>
    </div>
  );
}
