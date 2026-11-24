"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import ClassSectionPicker, { type ClassSectionValue } from "@/components/class-section-picker";
import WeeklyGrid from "@/components/timetable/weekly-grid";
import { Alert, Field, PageHeader, Select } from "@/components/form";
import { Card, DetailList, EmptyState, Loading } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { ApiError, getId } from "@/lib/api";
import { listStaff } from "@/lib/staff";
import {
  addTimetableOverride,
  getClassWeeklyTimetable,
  getPublishedClassTimetable,
  listPeriods,
  publishTimetableRelease,
  releaseId,
  saveTimetableDraft,
  type TimetableRelease,
} from "@/lib/timetable";
import type { TimetableEntry } from "@/lib/types/timetable";
import { formatDate, fullName, getErrorMessage, todayInput } from "@/lib/utils";

/**
 * The class timetable editor changes the working copy. A release freezes that copy,
 * effective from a date, so students and parents see a stable schedule. Overrides
 * change a single day (substitute teacher or cancelled period) without a new release.
 */
export default function TimetableReleasesPage() {
  const { years, defaultYearId } = useAcademicYears();
  const lookup = useAcademicLookup();
  const [selection, setSelection] = useState<ClassSectionValue>({ year: "", class: "", section: "" });
  const value = { ...selection, year: selection.year || defaultYearId };
  const ready = !!(value.year && value.class && value.section);
  const [asOf, setAsOf] = useState(todayInput());
  const key = `${value.year}:${value.class}:${value.section}`;

  const periods = useQuery(value.year ? `periods:${value.year}` : null, () => listPeriods(value.year));
  const working = useQuery(ready ? `timetable-working:${key}` : null, () => getClassWeeklyTimetable(value.class, value.section, value.year));
  // No release yet is a normal state, not an error
  const published = useQuery(ready ? `timetable-published:${key}:${asOf}` : null, () =>
    getPublishedClassTimetable(value.class, value.section, value.year, asOf).catch((err) => {
      if (err instanceof ApiError && err.status === 404) return null;
      throw err;
    })
  );
  const teachers = useQuery("staff:teaching", () => listStaff({ staff_type: "TEACHING" }));

  const [effectiveFrom, setEffectiveFrom] = useState(todayInput());
  const [draft, setDraft] = useState<TimetableRelease | null>(null);
  const [override, setOverride] = useState({ date: todayInput(), period: "", action: "SUBSTITUTE" as "SUBSTITUTE" | "CANCEL", teacher: "", reason: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const teacherName = (id?: string | null) => {
    const t = teachers.data?.find((s) => getId(s) === id);
    return t ? fullName(t) : "";
  };
  const renderEntry = (e: TimetableEntry) => (
    <>
      <span className="font-medium leading-tight">{e.subject_id ? lookup.subjectName(e.subject_id) : e.slot_type}</span>
      {e.staff_id && <span className="text-xs text-muted-foreground">{teacherName(e.staff_id)}</span>}
      {e.room && <span className="text-xs text-muted-foreground">Room {e.room}</span>}
    </>
  );

  const run = async (action: () => Promise<void>, fallback: string) => {
    setBusy(true); setError(""); setMessage("");
    try { await action(); } catch (err) { setError(getErrorMessage(err, fallback)); } finally { setBusy(false); }
  };

  const saveDraft = () => run(async () => {
    const entries = (working.data ?? []).map((e) => ({
      day_of_week: e.day_of_week, period_number: e.period_number, subject_id: e.subject_id ?? null,
      staff_id: e.staff_id ?? null, room: e.room ?? null, slot_type: e.slot_type ?? "LECTURE", remarks: e.remarks ?? null,
    }));
    if (entries.length === 0) throw new Error("The working timetable is empty. Fill it in under Class timetable first.");
    const saved = await saveTimetableDraft({
      academic_year_id: value.year, class_id: value.class, section_id: value.section,
      effective_from: effectiveFrom, expected_revision: published.data?.revision ?? 0,
      expected_draft_version: draft?.draft_version ?? 0, entries,
    });
    setDraft(saved);
    setMessage(`Draft saved with ${entries.length} slots. Publish it to make it live.`);
  }, "Could not save draft");

  const publish = () => {
    if (!draft || !window.confirm(`Publish this timetable from ${formatDate(effectiveFrom)}? Students and parents will see it.`)) return;
    run(async () => {
      const revision = draft.revision ?? (published.data?.revision ?? 0) + 1;
      await publishTimetableRelease(releaseId(draft), revision);
      setDraft(null); setMessage("Timetable published."); published.reload();
    }, "Could not publish");
  };

  const addOverride = (e: SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = published.data?.releaseId;
    if (!id) { setError("Publish a timetable before adding one-day changes."); return; }
    if (override.action === "SUBSTITUTE" && !override.teacher) { setError("Select the substitute teacher."); return; }
    run(async () => {
      await addTimetableOverride(id, {
        schedule_date: override.date, period_number: Number(override.period), action: override.action,
        substitute_teacher_id: override.action === "SUBSTITUTE" ? override.teacher : null, reason: override.reason.trim(),
      });
      setOverride({ ...override, reason: "", teacher: "" });
      setMessage("One-day change saved."); published.reload();
    }, "Could not save change");
  };

  const teachingPeriods = (periods.data ?? []).filter((p) => !p.is_break);

  return (
    <div className="space-y-5">
      <PageHeader title="Publish timetable" description="Release the working timetable to students and parents, and make one-day changes" />
      {(error || periods.error || working.error || published.error || teachers.error) && (
        <Alert type="error">{error || periods.error || working.error || published.error || teachers.error}</Alert>
      )}
      {message && <Alert type="success">{message}</Alert>}

      <ClassSectionPicker years={years} value={value} onChange={(next) => { setSelection(next); setDraft(null); }} />

      {!ready ? <EmptyState>Select a class and section.</EmptyState> : (
        <>
          <Card title="Live timetable" action={
            <Field label="As of" htmlFor="as-of" className="flex items-center gap-2 space-y-0">
              <Input id="as-of" type="date" value={asOf} onChange={(e) => setAsOf(e.target.value)} className="w-auto" />
            </Field>
          }>
            {published.loading || periods.loading ? <Loading /> : !published.data ? (
              <EmptyState>Nothing published for this date yet.</EmptyState>
            ) : (
              <div className="space-y-3">
                <DetailList items={[
                  { label: "Revision", value: String(published.data.revision || "—") },
                  { label: "Effective from", value: formatDate(published.data.effectiveFrom) },
                  { label: "Slots", value: String(published.data.entries.length) },
                ]} />
                {published.data.entries.length > 0 && <WeeklyGrid periods={periods.data ?? []} entries={published.data.entries} renderEntry={renderEntry} />}
              </div>
            )}
          </Card>

          <Card title="New release from working timetable">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                The working timetable has {working.loading ? "…" : working.data?.length ?? 0} slots. Saving a draft copies it; publishing makes it live from the date below.
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <Field label="Effective from" htmlFor="effective-from" required>
                  <Input id="effective-from" type="date" required value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
                </Field>
                <Button variant="outline" disabled={busy || working.loading} onClick={saveDraft}>{draft ? "Save draft again" : "Save draft"}</Button>
                <Button disabled={busy || !draft || !releaseId(draft)} onClick={publish}>Publish</Button>
              </div>
            </div>
          </Card>

          <Card title="One-day change">
            {!published.data?.releaseId ? <EmptyState>Publish a timetable first.</EmptyState> : (
              <form onSubmit={addOverride} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Field label="Date" htmlFor="ov-date" required>
                    <Input id="ov-date" type="date" required value={override.date} onChange={(e) => setOverride({ ...override, date: e.target.value })} />
                  </Field>
                  <Field label="Period" htmlFor="ov-period" required>
                    <Select id="ov-period" required value={override.period} onChange={(e) => setOverride({ ...override, period: e.target.value })}>
                      <option value="">Select</option>
                      {teachingPeriods.map((p) => <option key={p.period_number} value={p.period_number}>{p.name} ({p.start_time})</option>)}
                    </Select>
                  </Field>
                  <Field label="Change" htmlFor="ov-action">
                    <Select id="ov-action" value={override.action} onChange={(e) => setOverride({ ...override, action: e.target.value as "SUBSTITUTE" | "CANCEL" })}>
                      <option value="SUBSTITUTE">Substitute teacher</option>
                      <option value="CANCEL">Cancel period</option>
                    </Select>
                  </Field>
                  {override.action === "SUBSTITUTE" && (
                    <Field label="Substitute" htmlFor="ov-teacher" required>
                      <Select id="ov-teacher" required value={override.teacher} onChange={(e) => setOverride({ ...override, teacher: e.target.value })}>
                        <option value="">Select teacher</option>
                        {teachers.data?.map((t) => <option key={getId(t)} value={getId(t)}>{fullName(t)}</option>)}
                      </Select>
                    </Field>
                  )}
                </div>
                <Field label="Reason" htmlFor="ov-reason" required>
                  <Input id="ov-reason" required maxLength={300} value={override.reason} onChange={(e) => setOverride({ ...override, reason: e.target.value })} placeholder="e.g. Teacher on leave" />
                </Field>
                <Button type="submit" disabled={busy}>Save change</Button>
              </form>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
