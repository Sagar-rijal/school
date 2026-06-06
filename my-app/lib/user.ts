import { apiRequest } from "./api"; // Your wrapper with the cookie setup!

// 1. Define the types based on your schema
export interface UserPersonalInfo {
  father_name: string;
  mother_name: string;
  dob: string;
  id_number: string;
  current_address: string;
  permanent_address: string;
  gurdian_name: string; 
  gurdian_contact: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password?: string;
  phone_number: string;
  userPersonalInfo: UserPersonalInfo;
}

export function createUser(userData: CreateUserPayload) {
  
  return apiRequest("/user/", {
    method: "POST",
    body: userData,
  });
}