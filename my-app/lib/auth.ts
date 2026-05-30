// src/lib/auth.ts
import { apiRequest } from "./api";
import { LoginPayload ,RegisterPayload } from "./type";

const USE_MOCK = true;

export function loginUser(loginData: LoginPayload) {
  if (USE_MOCK) {
    return {
      success: true,
      message: "User login successfully",
      data: {
        _id: "1",
        name: "Admin",
        email: "admin@test.com",
        scope: "TENANT",
        status: "ACTIVE",
      },
    };
  }
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