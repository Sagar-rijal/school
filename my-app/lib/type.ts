// src/lib/types.ts

export type LoginPayload = {
  email: string;
  password: string;
};

export type SchoolPayload = {
  school_info: {
    name: string;
    board: string;
    medium: string;
    type: string;
    establishedYear: number;
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