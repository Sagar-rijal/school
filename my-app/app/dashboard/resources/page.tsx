"use client";

import { useState } from "react";
import type { SubmitEvent } from "react";
import { useSession } from "@/components/session-provider";
import { Alert, Field, PageHeader, Select } from "@/components/form";
import { Card, EmptyState, Loading, Table, TBody, TD, TH, THead } from "@/components/data-display";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery } from "@/hooks/use-query";
import { hasPermission } from "@/lib/access";
import { getId } from "@/lib/api";
import { allocateResource, createResource, listResourceAllocations, listResources, RESOURCE_TYPES, type ResourceType } from "@/lib/resources";
import { formatEnum, getErrorMessage } from "@/lib/utils";

export default function ResourcesPage() {
  const session = useSession();
  const [filter, setFilter] = useState<ResourceType | "">("");
  const resources = useQuery(`resources:${filter}`, () => listResources(filter || undefined));
  const [selectedId, setSelectedId] = useState("");
  const allocations = useQuery(selectedId ? `resource-allocations:${selectedId}` : null, () => listResourceAllocations(selectedId));
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<ResourceType>("ROOM");
  const [capacity, setCapacity] = useState("");
  const [location, setLocation] = useState("");
  const [purpose, setPurpose] = useState("");
  const [starts, setStarts] = useState("");
  const [ends, setEnds] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const canManage = session ? hasPermission(session, "resource:manage") : false;

  const add = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(""); setMessage(""); setBusy(true);
    try {
      await createResource({ name: name.trim(), code: code.trim(), resource_type: type,
        capacity: capacity ? Number(capacity) : null, location: location.trim() || null });
      setName(""); setCode(""); setCapacity(""); setLocation("");
      setMessage("Resource added."); resources.reload();
    } catch (err) { setError(getErrorMessage(err, "Could not add resource")); }
    finally { setBusy(false); }
  };

  const allocate = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(""); setMessage("");
    if (!selectedId || !starts || !ends || new Date(ends) <= new Date(starts)) {
      setError("Select a resource and a valid time range."); return;
    }
    setBusy(true);
    try {
      await allocateResource(selectedId, { purpose: purpose.trim(), start_time: new Date(starts).toISOString(), end_time: new Date(ends).toISOString() });
      setPurpose(""); setStarts(""); setEnds(""); setMessage("Resource allocated."); allocations.reload();
    } catch (err) { setError(getErrorMessage(err, "Could not allocate resource")); }
    finally { setBusy(false); }
  };

  const selected = resources.data?.find((item) => getId(item) === selectedId);
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader title="School resources" description="Rooms, equipment, and their bookings" />
      {(resources.error || allocations.error || error) && <Alert type="error">{resources.error || allocations.error || error}</Alert>}
      {message && <Alert type="success">{message}</Alert>}
      {canManage && <Card title="Add resource"><form onSubmit={add} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="resource-name" required><Input id="resource-name" required value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Code" htmlFor="resource-code" required><Input id="resource-code" required value={code} onChange={(e) => setCode(e.target.value)} /></Field>
          <Field label="Type" htmlFor="resource-type"><Select id="resource-type" value={type} onChange={(e) => setType(e.target.value as ResourceType)}>{RESOURCE_TYPES.map((item) => <option key={item} value={item}>{formatEnum(item)}</option>)}</Select></Field>
          <Field label="Capacity" htmlFor="resource-capacity"><Input id="resource-capacity" type="number" min={0} step={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} /></Field>
          <Field label="Location" htmlFor="resource-location"><Input id="resource-location" value={location} onChange={(e) => setLocation(e.target.value)} /></Field>
        </div><Button type="submit" disabled={busy}>{busy ? "Saving..." : "Add resource"}</Button>
      </form></Card>}
      <Field label="Filter by type" htmlFor="resource-filter"><Select id="resource-filter" value={filter} onChange={(e) => { setFilter(e.target.value as ResourceType | ""); setSelectedId(""); }} className="max-w-xs"><option value="">All types</option>{RESOURCE_TYPES.map((item) => <option key={item} value={item}>{formatEnum(item)}</option>)}</Select></Field>
      {resources.loading ? <Loading /> : (resources.data?.length ?? 0) === 0 ? <EmptyState>No resources found.</EmptyState> : <Table><THead><tr><TH>Name</TH><TH>Code</TH><TH>Type</TH><TH>Capacity</TH><TH>Location</TH><TH>Bookings</TH></tr></THead><TBody>{resources.data?.map((item, index) => <tr key={getId(item) || index}><TD className="font-medium">{item.name}</TD><TD>{item.code}</TD><TD>{formatEnum(item.resource_type)}</TD><TD>{item.capacity ?? "—"}</TD><TD>{item.location || "—"}</TD><TD><Button size="sm" variant="outline" onClick={() => setSelectedId(getId(item))}>View</Button></TD></tr>)}</TBody></Table>}
      {selected && <Card title={`Bookings: ${selected.name}`}>
        {canManage && <form onSubmit={allocate} className="mb-5 space-y-4"><div className="grid gap-4 sm:grid-cols-3">
          <Field label="Purpose" htmlFor="booking-purpose" required><Input id="booking-purpose" required value={purpose} onChange={(e) => setPurpose(e.target.value)} /></Field>
          <Field label="Starts" htmlFor="booking-start" required><Input id="booking-start" type="datetime-local" required value={starts} onChange={(e) => setStarts(e.target.value)} /></Field>
          <Field label="Ends" htmlFor="booking-end" required><Input id="booking-end" type="datetime-local" required min={starts} value={ends} onChange={(e) => setEnds(e.target.value)} /></Field>
        </div><Button type="submit" disabled={busy}>{busy ? "Saving..." : "Add booking"}</Button></form>}
        {allocations.loading ? <Loading /> : (allocations.data?.length ?? 0) === 0 ? <EmptyState>No bookings for this resource.</EmptyState> : <Table><THead><tr><TH>Purpose</TH><TH>Starts</TH><TH>Ends</TH></tr></THead><TBody>{allocations.data?.map((item, index) => <tr key={getId(item) || index}><TD>{item.purpose}</TD><TD>{new Date(item.start_time).toLocaleString()}</TD><TD>{new Date(item.end_time).toLocaleString()}</TD></tr>)}</TBody></Table>}
      </Card>}
    </div>
  );
}
