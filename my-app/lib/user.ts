import { apiRequest, findCreatedId } from "./api";
import type { CreateUserPayload } from "./types/user";

/** Creates a login account. Returns the new user's id when the response includes it. */
export async function createUser(payload: CreateUserPayload) {
  const res = await apiRequest("/user", { method: "POST", body: payload });
  return { userId: findCreatedId(res) };
}
