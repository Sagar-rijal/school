// src/lib/auth.ts
import { apiRequest } from "./api";
import { LoginPayload } from "./type";

export function loginUser(loginData: LoginPayload) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: loginData,
  });
}