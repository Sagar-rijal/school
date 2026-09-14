// Mirrors LoginCredentials / UserCreate / PersonalInfo from the backend OpenAPI spec

export type LoginPayload = {
  email: string;
  password: string;
};

export type UserPersonalInfo = {
  father_name: string;
  mother_name: string;
  dob: string;
  id_number: string;
  current_address: string;
  permanent_address: string;
  gurdian_name: string; // spelling matches the backend
  gurdian_contact: string;
};

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  phone_number?: string | null;
  // Optional, but when sent every field inside is required
  userPersonalInfo?: UserPersonalInfo | null;
};

export const ROLE_NAMES = [
  "SUPER_ADMIN",
  "SCHOOL_ADMIN",
  "TEACHER",
  "STUDENT",
  "PARENT",
  "ACCOUNTANT",
] as const;

export type RoleName = (typeof ROLE_NAMES)[number];
