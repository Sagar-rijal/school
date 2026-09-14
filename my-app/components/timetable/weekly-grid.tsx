"use client";

import type { ReactNode } from "react";
import { DAYS_OF_WEEK, type DayOfWeek, type PeriodDefinition, type TimetableEntry } from "@/lib/types/timetable";
import { cn, formatEnum } from "@/lib/utils";

type Props = {
  periods: PeriodDefinition[];
  entries: TimetableEntry[];
  renderEntry: (entry: TimetableEntry) => ReactNode;
  /** Makes slots clickable (class timetable editing). */
  onSlotClick?: (day: DayOfWeek, period: PeriodDefinition, entry?: TimetableEntry) => void;
};

/** Days × periods grid. Sunday is shown only when something is scheduled on it. */
export default function WeeklyGrid({ periods, entries, renderEntry, onSlotClick }: Props) {
  const days = DAYS_OF_WEEK.filter((d) => d !== "SUNDAY" || entries.some((e) => e.day_of_week === "SUNDAY"));
  const slot = (day: DayOfWeek, periodNumber: number) =>
    entries.find((e) => e.day_of_week === day && e.period_number === periodNumber);

  return (
    <div className="overflow-x-auto rounded-lg border bg-white">
      <table className="w-full min-w-[720px] table-fixed border-collapse text-sm">
        <thead>
          <tr className="border-b bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
            <th className="w-28 px-3 py-2 text-left font-medium">Period</th>
            {days.map((d) => (
              <th key={d} className="px-2 py-2 text-left font-medium">{formatEnum(d).slice(0, 3)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {periods.map((p) =>
            p.is_break ? (
              <tr key={p.period_number} className="border-b bg-muted/40">
                <td className="px-3 py-1.5">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.start_time}–{p.end_time}</p>
                </td>
                <td colSpan={days.length} className="px-2 text-center text-xs uppercase tracking-widest text-muted-foreground">
                  Break
                </td>
              </tr>
            ) : (
              <tr key={p.period_number} className="border-b last:border-0">
                <td className="px-3 py-2 align-top">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.start_time}–{p.end_time}</p>
                </td>
                {days.map((day) => {
                  const entry = slot(day, p.period_number);
                  const content = entry ? renderEntry(entry) : <span className="text-muted-foreground/60">{onSlotClick ? "+" : ""}</span>;
                  return (
                    <td key={day} className="border-l p-1 align-top">
                      {onSlotClick ? (
                        <button
                          type="button"
                          onClick={() => onSlotClick(day, p, entry)}
                          aria-label={`${formatEnum(day)} ${p.name}${entry ? "" : ", empty"}`}
                          className={cn(
                            "flex min-h-14 w-full flex-col items-start rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent",
                            entry ? "bg-primary/5" : "items-center justify-center"
                          )}
                        >
                          {content}
                        </button>
                      ) : (
                        <div className={cn("min-h-14 rounded-md px-2 py-1.5", entry && "bg-primary/5")}>{entry && content}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
