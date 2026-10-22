"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import ClassSectionPicker, { type ClassSectionValue } from "@/components/class-section-picker";
import { useSession } from "@/components/session-provider";
import { Alert, Field, PageHeader, Select } from "@/components/form";
import { Card, EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAcademicYears } from "@/hooks/use-academic-years";
import { useQuery } from "@/hooks/use-query";
import { listSubjects } from "@/lib/academic";
import { hasPermission } from "@/lib/access";
import { getId } from "@/lib/api";
import { createSyllabusUnit, listSyllabusUnits, updateSyllabusUnit, UNIT_STATUSES, type SyllabusUnit, type UnitStatus } from "@/lib/syllabus";
import { formatEnum, getErrorMessage } from "@/lib/utils";

export default function SyllabusPage() {
  const session = useSession();
  const years = useAcademicYears();
  const [selection, setSelection] = useState<ClassSectionValue>({ year: "", class: "", section: "" });
  const value = { ...selection, year: selection.year || years.defaultYearId };
  const [subjectId, setSubjectId] = useState("");
  const subjects = useQuery(value.class ? `syllabus-subjects:${value.class}` : null, () => listSubjects({ class_id: value.class }));
  const units = useQuery(value.year && value.class ? `syllabus:${value.year}:${value.class}:${subjectId}` : null,
    () => listSyllabusUnits({ academic_year_id: value.year, class_id: value.class, subject_id: subjectId || undefined }));
  const [editing, setEditing] = useState<SyllabusUnit | null>(null);
  const [unitNumber, setUnitNumber] = useState(1);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [hours, setHours] = useState("");
  const [status, setStatus] = useState<UnitStatus>("PLANNED");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canManage = session ? hasPermission(session, "syllabus:manage") : false;

  const resetForm = () => {
    setEditing(null);
    setUnitNumber(1);
    setTitle("");
    setDescription("");
    setHours("");
    setStatus("PLANNED");
  };

  const startEdit = (unit: SyllabusUnit) => {
    setEditing(unit);
    setUnitNumber(unit.unit_number);
    setTitle(unit.title);
    setDescription(unit.description);
    setHours(unit.estimated_hours == null ? "" : String(unit.estimated_hours));
    setStatus(unit.status ?? "PLANNED");
    setError("");
    setMessage("");
  };

  const submit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    if (!value.year || !value.class || !subjectId) {
      setError("Select an academic year, class, and subject first.");
      return;
    }
    const parsedHours = hours === "" ? null : Number(hours);
    if (parsedHours !== null && (!Number.isFinite(parsedHours) || parsedHours < 0)) {
      setError("Estimated hours must be zero or more.");
      return;
    }
    setBusy(true);
    try {
      if (editing) {
        const id = getId(editing);
        if (!id) throw new Error("This unit has no ID and cannot be updated.");
        await updateSyllabusUnit(id, { title: title.trim(), description: description.trim(), estimated_hours: parsedHours, status });
        setMessage("Syllabus unit updated.");
      } else {
        await createSyllabusUnit({ academic_year_id: value.year, class_id: value.class, subject_id: subjectId,
          unit_number: unitNumber, title: title.trim(), description: description.trim(), estimated_hours: parsedHours });
        setMessage("Syllabus unit added.");
      }
      resetForm();
      units.reload();
    } catch (err) {
      setError(getErrorMessage(err, "Could not save syllabus unit"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader title="Syllabus" description="Plan and track units by class and subject" />
      {(years.error || subjects.error || units.error || error) && <Alert type="error">{years.error || subjects.error || units.error || error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}
      <div className="flex flex-wrap items-center gap-2">
        <ClassSectionPicker years={years.years} value={value} hideSection onChange={(next) => { setSelection(next); setSubjectId(""); resetForm(); }} />
        <Select aria-label="Subject" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); resetForm(); }} disabled={!value.class || subjects.loading} className="w-auto min-w-40">
          <option value="">All subjects</option>
          {subjects.data?.map((subject) => <option key={getId(subject)} value={getId(subject)}>{subject.name}</option>)}
        </Select>
      </div>
      {canManage && value.class && subjectId && (
        <Card title={editing ? `Edit unit ${editing.unit_number}` : "Add syllabus unit"}>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Unit number" htmlFor="syllabus-number" required><Input id="syllabus-number" type="number" min={1} step={1} required disabled={!!editing} value={unitNumber} onChange={(e) => setUnitNumber(Number(e.target.value))} /></Field>
              <Field label="Estimated hours" htmlFor="syllabus-hours"><Input id="syllabus-hours" type="number" min={0} step="any" value={hours} onChange={(e) => setHours(e.target.value)} /></Field>
              <Field label="Title" htmlFor="syllabus-title" required><Input id="syllabus-title" required value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
              {editing && <Field label="Status" htmlFor="syllabus-status"><Select id="syllabus-status" value={status} onChange={(e) => setStatus(e.target.value as UnitStatus)}>{UNIT_STATUSES.map((item) => <option key={item} value={item}>{formatEnum(item)}</option>)}</Select></Field>}
            </div>
            <Field label="Description" htmlFor="syllabus-description" required><textarea id="syllabus-description" rows={3} required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-md border border-input bg-transparent p-3 text-sm" /></Field>
            <div className="flex gap-2"><Button type="submit" disabled={busy}>{busy ? "Saving..." : editing ? "Save changes" : "Add unit"}</Button>{editing && <Button type="button" variant="outline" onClick={resetForm}>Cancel</Button>}</div>
          </form>
        </Card>
      )}
      {years.loading || units.loading ? <Loading /> : !value.class ? <EmptyState>Select a class to view its syllabus.</EmptyState> : (units.data?.length ?? 0) === 0 ? <EmptyState>No syllabus units match these filters.</EmptyState> : (
        <Table><THead><tr><TH>Unit</TH><TH>Title</TH><TH>Subject</TH><TH>Status</TH><TH>Hours</TH>{canManage && <TH>Action</TH>}</tr></THead>
          <TBody>{units.data?.map((unit, index) => <tr key={getId(unit) || index}><TD>{unit.unit_number}</TD><TD><span className="font-medium">{unit.title}</span><p className="text-xs text-muted-foreground">{unit.description}</p></TD><TD>{subjects.data?.find((subject) => getId(subject) === unit.subject_id)?.name ?? unit.subject_id}</TD><TD>{formatEnum(unit.status ?? "PLANNED")}</TD><TD>{unit.estimated_hours ?? "—"}</TD>{canManage && <TD><Button variant="outline" size="sm" onClick={() => { setSubjectId(unit.subject_id); startEdit(unit); }}>Edit</Button></TD>}</tr>)}</TBody></Table>
      )}
    </div>
  );
}
