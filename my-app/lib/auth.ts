// src/lib/auth.ts
import { apiRequest } from "./api";
import { LoginPayload ,RegisterPayload } from "./type";

export function loginUser(loginData: LoginPayload) {
  return apiRequest("/auth/login", {
    method: "POST",
    body: loginData,
  });
}
export function registerUser(registerData: RegisterPayload) {
  return apiRequest("/user/", {
    method: "POST",
    body: registerData,
  });
}