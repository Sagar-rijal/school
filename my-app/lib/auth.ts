// src/lib/auth.ts
import { apiRequest } from "./api";
import { LoginPayload ,RegisterPayload } from "./type";


const USE_MOCK_LOGIN = true;

export async function loginUser(loginData: LoginPayload) {
  if (USE_MOCK_LOGIN) {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (
      loginData.email === "admin@test.com" &&
      loginData.password === "123456"
    ) {
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

    throw new Error("Invalid email or password");
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