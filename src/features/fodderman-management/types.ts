import { z } from "zod";

const pinCodeRegex = /^[1-9][0-9]{5}$/;
const mobileRegex = /^[0-9]{10}$/;
const nameRegex = /^[\p{L}\p{M}\s]+$/u;

const getNameSchema = (label: "First Name" | "Last Name") =>
  z
    .string()
    .trim()
    .nonempty(`${label} is required.`)
    .min(2, `${label} must be at least 2 characters long.`)
    .max(50, `${label} cannot exceed 50 characters.`)
    .regex(nameRegex, "Only letters and spaces allowed.");

export const foddermanSchema = z.object({
  firstName: getNameSchema("First Name"),
  lastName: getNameSchema("Last Name"),
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address.")
    .optional()
    .or(z.literal("")),
  mobileNumber: z
    .string()
    .trim()
    .nonempty("Mobile number is required.")
    .regex(mobileRegex, "Please enter a valid 10-digit mobile number."),
  languagePreference: z.enum(["en", "hi", "gu", "mr", "te", "pa", "ml"], {
    errorMap: () => ({ message: "Please select Language Preference." }),
  }),
  stateId: z.string().trim().nonempty("State is required."),
  districtId: z.string().trim().nonempty("District is required."),
  talukaId: z.string().trim().nonempty("Taluka is required."),
  pinCode: z
    .string()
    .trim()
    .nonempty("Pin code is required.")
    .regex(pinCodeRegex, "Please enter a valid 6-digit pin code."),
  partnerId: z.string().trim().nonempty("Partner is required"),
  villageIds: z
    .array(z.string())
    .min(1, "At least one village must be selected."),
});

export type FoddermanSchemaType = z.infer<typeof foddermanSchema>;

export type FoddermanStatus = "ACTIVE" | "INACTIVE";

export interface IFoddermanVillage {
  id: string;
  name: string;
}

export interface IFoddermanPartner {
  id: string;
  name: string;
  isActive?: boolean;
}

export interface IFodderman {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email?: string;
  mobileNumber: string;
  languagePreference: "en" | "hi" | "gu" | "mr" | "te" | "pa" | "ml";
  stateId: string;
  stateName: string;
  districtId: string;
  districtName: string;
  talukaId: string;
  talukaName: string;
  pinCode: string;
  partnerId?: string;
  partnerName?: string;
  villageIds: string[];
  villages: IFoddermanVillage[];
  allocatedVillages: string[];
  totalAllocatedVillages: number;
  isActive: boolean;
  status: FoddermanStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface IFoddermanFilters {
  stateId?: string;
  districtId?: string;
  talukaId?: string;
  partnerId?: string;
  status?: "active" | "inactive";
  sortBy?: "createdAt" | "firstName" | "lastName";
  sortOrder?: "ASC" | "DESC";
}

export interface IFoddermanListMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface IFoddermanListResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: IFodderman[];
  meta: IFoddermanListMeta;
  timestamp: string;
}

export interface IFoddermanMutationResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: IFodderman;
  timestamp: string;
}

export interface IFoddermanMutationPayload {
  firstName: string;
  lastName: string;
  email?: string;
  mobileNumber: string;
  languagePreference: "en" | "hi" | "gu" | "mr" | "te" | "pa" | "ml";
  stateId: string;
  districtId: string;
  talukaId: string;
  pinCode: string;
  partnerId?: string;
  villageAllocation: string[];
}
