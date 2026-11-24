"use client";

import { useState } from "react";
import FamilyPage, { type FamilyContext } from "@/components/family/family-page";
import { Alert, Select } from "@/components/form";
import { EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { useAcademicLookup } from "@/hooks/use-academic-lookup";
import { useQuery } from "@/hooks/use-query";
import { getId } from "@/lib/api";
import { listMaterials, MATERIAL_TYPES, materialDownloadUrl, type MaterialType } from "@/lib/materials";
import { formatEnum } from "@/lib/utils";

function Materials({ child }: FamilyContext) {
  const lookup = useAcademicLookup();
  const e = child.enrollment;
  const [type, setType] = useState<MaterialType | "">("");
  const [after, setAfter] = useState("");
  const materials = useQuery(e ? `family-materials:${e.class_id}:${e.section_id}:${type}:${after}` : null, () =>
    listMaterials({ academic_year_id: e!.academic_year_id, class_id: e!.class_id, section_id: e!.section_id, status: "PUBLISHED", material_type: type || undefined, after: after || undefined })
  );

  if (!e) return <EmptyState>Not enrolled in a class yet.</EmptyState>;

  return (
    <>
      {materials.error && <Alert type="error">{materials.error}</Alert>}
      <Select aria-label="Material type" value={type} onChange={(ev) => { setType(ev.target.value as MaterialType | ""); setAfter(""); }} className="w-auto">
        <option value="">All types</option>
        {MATERIAL_TYPES.map((t) => <option key={t} value={t}>{formatEnum(t)}</option>)}
      </Select>
      {materials.loading ? <Loading /> : (materials.data?.items.length ?? 0) === 0 ? <EmptyState>No study materials shared yet.</EmptyState> : (
        <Table>
          <THead><tr><TH>Title</TH><TH>Subject</TH><TH>Type</TH><TH></TH></tr></THead>
          <TBody>
            {materials.data!.items.map((m, i) => {
              const id = getId(m);
              return (
                <tr key={id || i}>
                  <TD><span className="font-medium">{m.title}</span>{m.description && <p className="text-xs text-muted-foreground">{m.description}</p>}</TD>
                  <TD>{m.subject_id ? lookup.subjectName(m.subject_id) : "—"}</TD>
                  <TD>{formatEnum(m.material_type ?? "DOCUMENT")}</TD>
                  <TD>
                    {m.file_url ? <a href={m.file_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Open</a>
                      : id ? <a href={materialDownloadUrl(id)} target="_blank" rel="noopener noreferrer" className="text-primary underline">Download</a> : "—"}
                  </TD>
                </tr>
              );
            })}
          </TBody>
        </Table>
      )}
      {materials.data?.next && <Button variant="outline" onClick={() => setAfter(materials.data!.next!)}>Next page</Button>}
    </>
  );
}

export default function FamilyMaterialsPage() {
  return <FamilyPage title="Study materials" description="Notes, books and links from your teachers">{(ctx) => <Materials {...ctx} />}</FamilyPage>;
}
