import { apiRequest } from "./api";
import type { CreateUserPayload } from "./types/user";

export function createUser(payload: CreateUserPayload) {
  return apiRequest("/user", { method: "POST", body: payload });
}
