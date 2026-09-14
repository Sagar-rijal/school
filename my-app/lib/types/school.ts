// Mirrors SchoolCreate / SchoolUpdate from the backend OpenAPI spec

export const SCHOOL_BOARDS = ["CBSE", "CISCE", "IB"] as const;
export const SCHOOL_MEDIUMS = ["HINDI", "ENGLISH", "PUNJABI"] as const;
export const SCHOOL_TYPES = ["GOVT", "PRIVATE"] as const;

export type SchoolBoard = (typeof SCHOOL_BOARDS)[number];
export type SchoolMedium = (typeof SCHOOL_MEDIUMS)[number];
export type SchoolType = (typeof SCHOOL_TYPES)[number];
export type SchoolStatus = 0 | 1;

export type SchoolDetails = {
  name: string;
  board: SchoolBoard;
  medium: SchoolMedium;
  type: SchoolType;
  establishedYear: number;
};

export type SchoolContactInfo = {
  email: string;
  phone: string;
  website: string;
  brandingLogo: string;
};

export type SchoolAddress = {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type SchoolPayload = {
  school_info: SchoolDetails;
  contact_info: SchoolContactInfo;
  address: SchoolAddress;
  status: SchoolStatus;
};

export type School = SchoolPayload & {
  _id?: string;
  id?: string;
};
