import { apiRequest, unwrap, unwrapPage } from "./api";

export const RESOURCE_TYPES = ["LAB", "ROOM", "PROJECTOR", "SPORT_EQUIPMENT", "BUS", "OTHER"] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];

export type SchoolResource = {
  id?: string;
  _id?: string;
  name: string;
  code: string;
  resource_type: ResourceType;
  capacity?: number | null;
  location?: string | null;
};

export type ResourceAllocation = {
  id?: string;
  _id?: string;
  resource_id: string;
  allocated_to_class_id?: string | null;
  purpose: string;
  start_time: string;
  end_time: string;
};

export type ResourceAllocationPayload = Pick<ResourceAllocation, "purpose" | "start_time" | "end_time"> & {
  allocated_to_class_id?: string | null;
};

export async function listResources(resourceType?: ResourceType) {
  return unwrapPage<SchoolResource>(await apiRequest("/resources", { query: { resource_type: resourceType } })).items;
}

export async function getResource(id: string) {
  return unwrap<SchoolResource>(await apiRequest(`/resources/${encodeURIComponent(id)}`));
}

export function createResource(payload: Omit<SchoolResource, "id" | "_id">) {
  return apiRequest("/resources", { method: "POST", body: payload });
}

export async function listResourceAllocations(resourceId?: string) {
  return unwrapPage<ResourceAllocation>(await apiRequest("/resources/allocations/all", { query: { resource_id: resourceId } })).items;
}

export function allocateResource(id: string, payload: ResourceAllocationPayload) {
  return apiRequest(`/resources/${encodeURIComponent(id)}/allocate`, { method: "POST", body: payload });
}
