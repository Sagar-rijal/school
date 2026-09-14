"use client";

import { use, useEffect, useState } from "react";
import type { SubmitEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, Field, PageHeader, Select } from "@/components/form";
import { EmptyState, Loading } from "@/components/data-display";
import ClassSectionPicker from "@/components/class-section-picker";
import WeeklyGrid from "@/components/timetable/weekly-grid";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { useUrlFilters } from "@/hooks/use-url-filters";
import { listSubjects } from "@/lib/academic";
import { getId } from "@/lib/api";
import { listStaff } from "@/lib/staff";
import {
  bulkUploadTimetable,
  clearClassTimetable,
  deleteTimetableEntry,
  getClassWeeklyTimetable,
  listPeriods,
  saveTimetableEntry,
} from "@/lib/timetable";
import { DAYS_OF_WEEK, SLOT_TYPES, type DayOfWeek, type PeriodDefinition, type SlotType, type TimetableEntry } from "@/lib/types/timetable";
import { emptyToNull, formatEnum, fullName, getErrorMessage } from "@/lib/utils";

type Filters = { year?: string; class?: string; section?: string };
type Editing = { day: DayOfWeek; period: PeriodDefinition; entry?: TimetableEntry };

export default function ClassTimetablePage({ searchParams }: { searchParams: Promise<Filters> }) {
  const filters = use(searchParams);
  const setFilters = useUrlFilters("/dashboard/timetable/class", filters);
  const { years, defaultYearId } = useAcademicYears();
  const year = filters.year || defaultYearId;
  const ready = !!(year && filters.class && filters.section);

  const periods = useQuery(year ? `periods:${year}` : null, () => listPeriods(year));
  const timetable = useQuery(ready ? `timetable:${year}:${filters.class}:${filters.section}` : null, () =>
    getClassWeeklyTimetable(filters.class!, filters.section!, year)
  );
  const subjects = useQuery(filters.class ? `subjects:class:${filters.class}` : null, async () => (await listSubjects({ class_id: filters.class })) ?? []);
  const teachers = useQuery("staff:teaching", () => listStaff({ staff_type: "TEACHING" }));

  const [editing, setEditing] = useState<Editing | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copyFrom, setCopyFrom] = useState<DayOfWeek>("MONDAY");

  const subjectName = (id?: string | null) => subjects.data?.find((s) => getId(s) === id)?.name;
  const teacherName = (id?: string | null) => {
    const t = teachers.data?.find((s) => getId(s) === id);
    return t ? fullName(t) : undefined;
  };

  const entries = timetable.data ?? [];
  const location = ready ? { academic_year_id: year, class_id: filters.class!, section_id: filters.section! } : null;

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    setBusy(true);
    setError("");
    try {
      await action();
      timetable.reload();
      return true;
    } catch (err) {
      setError(getErrorMessage(err, fallback));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleCopyDay = async () => {
    if (!location) return;
    const source = entries.filter((e) => e.day_of_week === copyFrom);
    if (source.length === 0) {
      setError(`Nothing is scheduled on ${formatEnum(copyFrom)} to copy.`);
      return;
    }
    const targets = DAYS_OF_WEEK.filter((d) => d !== copyFrom && d !== "SUNDAY");
    if (!window.confirm(`Copy ${formatEnum(copyFrom)}'s ${source.length} slots to ${targets.map((d) => formatEnum(d).slice(0, 3)).join(", ")}? Matching slots on those days are replaced.`)) return;
    await run(
      () =>
        bulkUploadTimetable({
          ...location,
          entries: targets.flatMap((day) =>
            source.map((e) => ({
              day_of_week: day,
              period_number: e.period_number,
              subject_id: e.subject_id ?? null,
              staff_id: e.staff_id ?? null,
              room: e.room ?? null,
              slot_type: e.slot_type ?? "LECTURE",
              remarks: e.remarks ?? null,
            }))
          ),
        }),
      "Failed to copy day"
    );
  };

  const handleClearAll = () => {
    if (!location || !window.confirm("Clear the entire timetable for this section? This cannot be undone.")) return;
    run(() => clearClassTimetable(location.class_id, location.section_id, location.academic_year_id), "Failed to clear timetable");
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Class timetable" description="Click a slot to set the subject, teacher and room" />

      <ClassSectionPicker
        years={years}
        value={{ year, class: filters.class ?? "", section: filters.section ?? "" }}
        onChange={(v) => setFilters({ year: v.year, class: v.class, section: v.section })}
      />

      {!ready ? (
        <EmptyState>Select a class and section to view its timetable.</EmptyState>
      ) : periods.loading || timetable.loading ? (
        <Loading>Loading timetable...</Loading>
      ) : (periods.data ?? []).length === 0 ? (
        <EmptyState>
          No periods are defined for this academic year.{" "}
          <Link href={`/dashboard/timetable/periods?year=${year}`} className="underline">Set up periods</Link> first.
        </EmptyState>
      ) : (
        <>
          {(error || timetable.error || periods.error) && <Alert type="error">{error || timetable.error || periods.error}</Alert>}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Copy</span>
              <Select aria-label="Day to copy" value={copyFrom} onChange={(e) => setCopyFrom(e.target.value as DayOfWeek)} className="h-8 w-auto">
                {DAYS_OF_WEEK.filter((d) => d !== "SUNDAY").map((d) => <option key={d} value={d}>{formatEnum(d)}</option>)}
              </Select>
              <Button variant="outline" size="sm" disabled={busy} onClick={handleCopyDay}>to other weekdays</Button>
            </div>
            <Button variant="outline" size="sm" disabled={busy || entries.length === 0} onClick={handleClearAll} className="text-red-600 hover:text-red-700">
              Clear timetable
            </Button>
          </div>

          <WeeklyGrid
            periods={periods.data!}
            entries={entries}
            onSlotClick={(day, period, entry) => {
              setError("");
              setEditing({ day, period, entry });
            }}
            renderEntry={(e) => (
              <>
                <span className="font-medium leading-tight">{subjectName(e.subject_id) ?? (e.slot_type && e.slot_type !== "LECTURE" ? formatEnum(e.slot_type) : "—")}</span>
                {teacherName(e.staff_id) && <span className="text-xs text-muted-foreground">{teacherName(e.staff_id)}</span>}
                {e.room && <span className="text-xs text-muted-foreground">Room {e.room}</span>}
              </>
            )}
          />
        </>
      )}

      {editing && location && (
        <SlotEditor
          editing={editing}
          subjects={subjects.data ?? []}
          teachers={(teachers.data ?? []).filter((t) => (t.status ?? "ACTIVE") === "ACTIVE")}
          busy={busy}
          onClose={() => setEditing(null)}
          onSave={async (slot) => {
            const ok = await run(
              () => saveTimetableEntry({ ...location, day_of_week: editing.day, period_number: editing.period.period_number, ...slot }),
              "Failed to save slot"
            );
            if (ok) setEditing(null);
          }}
          onClear={async () => {
            const id = editing.entry ? getId(editing.entry) : "";
            if (!id) return;
            const ok = await run(() => deleteTimetableEntry(id), "Failed to clear slot");
            if (ok) setEditing(null);
          }}
          error={error}
        />
      )}
    </div>
  );
}

type SlotValues = { subject_id: string | null; staff_id: string | null; room: string | null; slot_type: SlotType; remarks: string | null };

function SlotEditor({
  editing,
  subjects,
  teachers,
  busy,
  error,
  onClose,
  onSave,
  onClear,
}: {
  editing: Editing;
  subjects: { _id?: string; id?: string; name: string }[];
  teachers: { _id?: string; id?: string; first_name?: string; last_name?: string }[];
  busy: boolean;
  error: string;
  onClose: () => void;
  onSave: (slot: SlotValues) => void;
  onClear: () => void;
}) {
  const { entry } = editing;
  const [subjectId, setSubjectId] = useState(entry?.subject_id ?? "");
  const [staffId, setStaffId] = useState(entry?.staff_id ?? "");
  const [room, setRoom] = useState(entry?.room ?? "");
  const [slotType, setSlotType] = useState<SlotType>(entry?.slot_type ?? editing.period.slot_type ?? "LECTURE");
  const [remarks, setRemarks] = useState(entry?.remarks ?? "");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave({ subject_id: subjectId || null, staff_id: staffId || null, room: emptyToNull(room), slot_type: slotType, remarks: emptyToNull(remarks) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center" onClick={onClose}>
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="slot-editor-title"
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md space-y-4 rounded-lg bg-white p-5 shadow-xl"
      >
        <div>
          <h2 id="slot-editor-title" className="font-semibold">
            {formatEnum(editing.day)} · {editing.period.name}
          </h2>
          <p className="text-sm text-muted-foreground">{editing.period.start_time}–{editing.period.end_time}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Subject" htmlFor="slot-subject" className="sm:col-span-2">
            <Select id="slot-subject" autoFocus value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
              <option value="">No subject</option>
              {subjects.map((s) => <option key={getId(s)} value={getId(s)}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Teacher" htmlFor="slot-teacher" className="sm:col-span-2">
            <Select id="slot-teacher" value={staffId} onChange={(e) => setStaffId(e.target.value)}>
              <option value="">No teacher</option>
              {teachers.map((t) => <option key={getId(t)} value={getId(t)}>{fullName(t)}</option>)}
            </Select>
          </Field>
          <Field label="Room" htmlFor="slot-room">
            <Input id="slot-room" value={room} onChange={(e) => setRoom(e.target.value)} />
          </Field>
          <Field label="Slot type" htmlFor="slot-type">
            <Select id="slot-type" value={slotType} onChange={(e) => setSlotType(e.target.value as SlotType)}>
              {SLOT_TYPES.map((t) => <option key={t} value={t}>{formatEnum(t)}</option>)}
            </Select>
          </Field>
          <Field label="Remarks" htmlFor="slot-remarks" className="sm:col-span-2">
            <Input id="slot-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </Field>
        </div>

        {error && <Alert type="error">{error}</Alert>}

        <div className="flex items-center justify-between gap-2">
          {entry ? (
            <Button type="button" variant="outline" disabled={busy} onClick={onClear} className="text-red-600 hover:text-red-700">Clear slot</Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
