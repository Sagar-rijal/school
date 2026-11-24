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
import { matchesAssignment, useTeacherAssignments } from "@/hooks/use-teacher-assignments";
import { listSubjects } from "@/lib/academic";
import { hasPermission } from "@/lib/access";
import { getId } from "@/lib/api";
import { createMaterial, deleteMaterial, getMaterial, listMaterials, listMaterialVersions, MATERIAL_STATUSES, MATERIAL_TYPES, materialDownloadUrl, replaceMaterialFile, transitionMaterial, type MaterialStatus, type MaterialType } from "@/lib/materials";
import { uploadFile } from "@/lib/files";
import { formatEnum, getErrorMessage } from "@/lib/utils";

export default function MaterialsPage() {
  const session = useSession();
  const years = useAcademicYears();
  const teacherAssignments = useTeacherAssignments();
  const [selection, setSelection] = useState<ClassSectionValue>({ year: "", class: "", section: "" });
  const value = { ...selection, year: selection.year || (teacherAssignments.teacher
    ? teacherAssignments.assignments.find((item) => item.academic_year_id === years.defaultYearId)?.academic_year_id
      || teacherAssignments.assignments[0]?.academic_year_id || years.defaultYearId
    : years.defaultYearId) };
  const [subjectId, setSubjectId] = useState("");
  const assigned = !teacherAssignments.teacher || matchesAssignment(teacherAssignments.assignments, value.year, value.class, value.section, subjectId || undefined);
  const [filterStatus, setFilterStatus] = useState<MaterialStatus | "">("");
  const [filterType, setFilterType] = useState<MaterialType | "">("");
  const [after, setAfter] = useState("");
  const subjects = useQuery(value.class && (!teacherAssignments.teacher || matchesAssignment(teacherAssignments.assignments, value.year, value.class, value.section)) ? `material-subjects:${value.class}` : null, () => listSubjects({ class_id: value.class }));
  const queryKey = `materials:${value.year}:${value.class}:${value.section}:${subjectId}:${filterStatus}:${filterType}:${after}`;
  const materials = useQuery(!teacherAssignments.teacher || (value.class && value.section && assigned) ? queryKey : null, () => listMaterials({ academic_year_id: value.year || undefined, class_id: value.class || undefined,
    section_id: value.section || undefined, subject_id: subjectId || undefined, status: filterStatus || undefined,
    material_type: filterType || undefined, after: after || undefined }));
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [newFile, setNewFile] = useState<File | null>(null);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [type, setType] = useState<MaterialType>("LINK");
  const [selectedId, setSelectedId] = useState("");
  const [replacing, setReplacing] = useState<{ id: string; file: File | null; reason: string } | null>(null);
  const versions = useQuery(selectedId ? `material-versions:${selectedId}` : null, () => listMaterialVersions(selectedId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canManage = session ? hasPermission(session, "material:manage") : false;

  const add = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault(); setError(""); setMessage("");
    if (!assigned || (teacherAssignments.teacher && (!value.class || !value.section || !subjectId))) { setError("Select an assigned class, section, and subject."); return; }
    if (!url.trim() && !newFile) { setError("Add a link or upload a file."); return; }
    setBusy(true);
    try {
      const fileId = newFile ? await uploadFile(newFile, "material") : null;
      await createMaterial({ title: title.trim(), description: description.trim(), material_type: type,
        academic_year_id: value.year || null, class_id: value.class || null, section_id: value.section || null,
        subject_id: subjectId || null, file_url: url.trim() || null, file_id: fileId });
      setTitle(""); setDescription(""); setUrl(""); setNewFile(null); setFileInputKey((k) => k + 1); setMessage("Study material added as a draft."); materials.reload();
    } catch (err) { setError(getErrorMessage(err, "Could not add study material")); }
    finally { setBusy(false); }
  };

  const transition = async (id: string, action: "publish" | "archive") => {
    setError(""); setMessage(""); setBusy(true);
    try {
      const current = await getMaterial(id);
      if (!Number.isInteger(current.revision)) throw new Error("Could not read the material revision. Refresh and try again.");
      await transitionMaterial(id, action, current.revision!);
      setMessage(action === "publish" ? "Material published." : "Material archived."); materials.reload();
    } catch (err) { setError(getErrorMessage(err, `Could not ${action} material`)); }
    finally { setBusy(false); }
  };

  const remove = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setError(""); setMessage(""); setBusy(true);
    try { await deleteMaterial(id); if (selectedId === id) setSelectedId(""); setMessage("Material deleted."); materials.reload(); }
    catch (err) { setError(getErrorMessage(err, "Could not delete material")); }
    finally { setBusy(false); }
  };

  const replace = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!replacing?.file) { setError("Choose the new file."); return; }
    setError(""); setMessage(""); setBusy(true);
    try {
      const current = await getMaterial(replacing.id);
      if (!Number.isInteger(current.revision)) throw new Error("Could not read the material revision. Refresh and try again.");
      const fileId = await uploadFile(replacing.file, "material");
      await replaceMaterialFile(replacing.id, { file_id: fileId, expected_revision: current.revision!, reason: replacing.reason.trim() });
      setReplacing(null); setMessage("File replaced. The previous file is kept as an older version."); materials.reload(); versions.reload();
    } catch (err) { setError(getErrorMessage(err, "Could not replace file")); }
    finally { setBusy(false); }
  };

  return <div className="mx-auto max-w-5xl space-y-5">
    <PageHeader title="Study materials" description="Share learning links and manage publication" />
    {(years.error || teacherAssignments.error || subjects.error || materials.error || versions.error || error) && <Alert type="error">{years.error || teacherAssignments.error || subjects.error || materials.error || versions.error || error}</Alert>}
    {message && <Alert type="success">{message}</Alert>}
    <div className="flex flex-wrap items-center gap-2"><ClassSectionPicker years={years.years} allowedAssignments={teacherAssignments.teacher ? teacherAssignments.assignments : undefined} value={value} onChange={(next) => { setSelection(next); setSubjectId(""); setAfter(""); }} />
      <Select aria-label="Subject" value={subjectId} onChange={(e) => { setSubjectId(e.target.value); setAfter(""); }} disabled={!value.class || subjects.loading} className="w-auto min-w-40"><option value="">All subjects</option>{subjects.data?.filter((item) => !teacherAssignments.teacher || matchesAssignment(teacherAssignments.assignments, value.year, value.class, value.section, getId(item))).map((item) => <option key={getId(item)} value={getId(item)}>{item.name}</option>)}</Select>
    </div>
    {canManage && (!teacherAssignments.teacher || (value.class && value.section && subjectId && assigned)) && <Card title="Add material"><form onSubmit={add} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Title" htmlFor="material-title" required><Input id="material-title" required maxLength={200} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Type" htmlFor="material-type"><Select id="material-type" value={type} onChange={(e) => setType(e.target.value as MaterialType)}>{MATERIAL_TYPES.map((item) => <option key={item} value={item}>{formatEnum(item)}</option>)}</Select></Field>
        <Field label="URL" htmlFor="material-url" hint="Or upload a file instead"><Input id="material-url" type="url" maxLength={2000} value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></Field>
        <Field label="File" htmlFor="material-file"><Input key={fileInputKey} id="material-file" type="file" onChange={(e) => setNewFile(e.target.files?.[0] ?? null)} /></Field>
      </div><Field label="Description" htmlFor="material-description"><textarea id="material-description" rows={2} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} className="w-full rounded-md border border-input bg-transparent p-3 text-sm" /></Field>
      <Button type="submit" disabled={busy}>{busy ? "Saving..." : "Add draft"}</Button>
    </form></Card>}
    <div className="flex flex-wrap gap-2"><Select aria-label="Material status" value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value as MaterialStatus | ""); setAfter(""); }} className="w-auto"><option value="">All statuses</option>{MATERIAL_STATUSES.map((item) => <option key={item} value={item}>{formatEnum(item)}</option>)}</Select>
      <Select aria-label="Material type" value={filterType} onChange={(e) => { setFilterType(e.target.value as MaterialType | ""); setAfter(""); }} className="w-auto"><option value="">All types</option>{MATERIAL_TYPES.map((item) => <option key={item} value={item}>{formatEnum(item)}</option>)}</Select></div>
    {teacherAssignments.loading || materials.loading ? <Loading /> : teacherAssignments.teacher && value.class && value.section && !assigned ? <Alert type="error">This class, section, or subject is not assigned to you.</Alert> : teacherAssignments.teacher && (!value.class || !value.section) ? <EmptyState>Select an assigned class and section to view materials.</EmptyState> : (materials.data?.items.length ?? 0) === 0 ? <EmptyState>No study materials match these filters.</EmptyState> : <Table><THead><tr><TH>Title</TH><TH>Type</TH><TH>Status</TH><TH>Open</TH><TH>Actions</TH></tr></THead><TBody>{materials.data?.items.map((item, index) => { const id = getId(item); return <tr key={id || index}><TD><span className="font-medium">{item.title}</span>{item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}</TD><TD>{formatEnum(item.material_type ?? "DOCUMENT")}</TD><TD>{formatEnum(item.status ?? "DRAFT")}</TD><TD>{item.file_url ? <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Open</a> : id ? <a href={materialDownloadUrl(id)} target="_blank" rel="noopener noreferrer" className="text-primary underline">Download</a> : "—"}</TD><TD><div className="flex flex-wrap gap-2">{id && <Button size="sm" variant="outline" onClick={() => setSelectedId(id)}>Versions</Button>}{canManage && id && item.status === "DRAFT" && <Button size="sm" disabled={busy} onClick={() => transition(id, "publish")}>Publish</Button>}{canManage && id && item.status === "PUBLISHED" && <Button size="sm" variant="outline" disabled={busy} onClick={() => transition(id, "archive")}>Archive</Button>}{canManage && id && item.status !== "ARCHIVED" && <Button size="sm" variant="outline" disabled={busy} onClick={() => setReplacing({ id, file: null, reason: "" })}>Replace file</Button>}{canManage && id && <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" disabled={busy} onClick={() => remove(id, item.title)}>Delete</Button>}</div></TD></tr>; })}</TBody></Table>}
    {materials.data?.next && <Button variant="outline" onClick={() => setAfter(materials.data!.next!)}>Next page</Button>}
    {replacing && <Card title="Replace file"><form onSubmit={replace} className="space-y-4"><div className="grid gap-4 sm:grid-cols-2">
      <Field label="New file" htmlFor="replace-file" required><Input id="replace-file" type="file" required onChange={(e) => setReplacing({ ...replacing, file: e.target.files?.[0] ?? null })} /></Field>
      <Field label="Reason" htmlFor="replace-reason" required><Input id="replace-reason" required maxLength={1000} value={replacing.reason} onChange={(e) => setReplacing({ ...replacing, reason: e.target.value })} placeholder="e.g. Corrected answer key" /></Field>
    </div><div className="flex gap-2"><Button type="submit" disabled={busy}>{busy ? "Uploading..." : "Replace"}</Button><Button type="button" variant="outline" onClick={() => setReplacing(null)}>Cancel</Button></div></form></Card>}
    {selectedId && <Card title="Material versions">{versions.loading ? <Loading /> : (versions.data?.items.length ?? 0) === 0 ? <EmptyState>No versions found.</EmptyState> : <Table><THead><tr><TH>Version</TH><TH>Added</TH><TH>Reason</TH><TH>File</TH></tr></THead><TBody>{versions.data?.items.map((item, index) => <tr key={getId(item) || index}><TD>{item.version ?? index + 1}</TD><TD>{item.created_at ? new Date(item.created_at).toLocaleString() : "—"}</TD><TD>{item.reason || "—"}</TD><TD>{getId(item) ? <a href={materialDownloadUrl(selectedId, getId(item))} target="_blank" rel="noopener noreferrer" className="text-primary underline">Download</a> : "—"}</TD></tr>)}</TBody></Table>}</Card>}
  </div>;
}
