// src/lib/types.ts

export type LoginPayload = {
  email: string;
  password: string;
};
export type RegisterPayload = {
  name: string;
  phone_number: string;
  email: string;
  password: string;
};

export type SchoolPayload = {
  _id?: string; 
  school_info: {
    name: string;
    board: string;
    medium: string;
    type: string;
    establishedYear: string | number;
  };
  contact_info: {
    email: string;
    phone: string;
    website: string;
    brandingLogo: string;
  };
  address: {
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    pincode: string;
    country: string;
  };
  status: number;
};