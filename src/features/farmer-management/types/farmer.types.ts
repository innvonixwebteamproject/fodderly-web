import { z } from "zod";

const nameRegex = /^[A-Za-z\s]+$/;
const mobileRegex = /^[0-9]{10}$/;
const pinRegex = /^[1-9][0-9]{5}$/;

const getFarmerNameSchema = (label: "First Name" | "Last Name") =>
  z
    .string()
    .trim()
    .nonempty(`${label} is required.`)
    .min(2, `${label} must be at least 2 characters long.`)
    .max(50, `${label} cannot exceed 50 characters.`)
    .regex(nameRegex, "Only letters and spaces allowed.");

/** Form + API payload for create / full update */
export const farmerFormSchema = z.object({
  firstName: getFarmerNameSchema("First Name"),
  lastName: getFarmerNameSchema("Last Name"),
  phone: z
    .string()
    .trim()
    .nonempty("Mobile Number is required.")
    .regex(mobileRegex, "Mobile Number must be 10 digits."),
  pincode: z
    .string()
    .trim()
    .nonempty("Pin Code is required.")
    .regex(pinRegex, "Pin Code must be 6 digits."),
  stateId: z.string().trim().nonempty("State is required."),
  districtId: z.string().trim().nonempty("District is required."),
  talukaId: z.string().trim().nonempty("Taluka is required."),
  villageId: z.string().trim().nonempty("Village is required."),
  address: z.string().trim().max(200, "Address cannot exceed 200 characters."),
  foddermanId: z.string().trim().nonempty("Fodderman is required."),
  /** UI-only until PATCH accepts partnerId */
  partnerId: z.string().trim().optional(),
});

export type FarmerFormSchemaType = z.infer<typeof farmerFormSchema>;

/** Normalized domain model (aligned with product spec) */
export interface Farmer {
  id: string;
  firstName: string;
  lastName: string;
  mobile: string;
  stateId: string;
  districtId: string;
  talukaId: string;
  villageId: string;
  pincode: string;
  address?: string;
  foddermanId?: string;
  partnerId?: string;
  status: "ACTIVE" | "INACTIVE";
  registrationSource: "SELF" | "ADMIN";
  createdAt: string;
}

/** Row / detail model after API mapping */
export interface IFarmer extends Farmer {
  fullName: string;
  phone: string;
  stateName: string;
  districtName: string;
  talukaName: string;
  villageName: string;
  foddermanName?: string;
  foddermanPhone?: string;
  partnerName?: string;
  address?: string;
  isActive: boolean;
  isVerified?: boolean;
  isDeleted?: boolean;
  updatedAt?: string;
}

export interface FarmerSelectOption {
  value: string;
  label: string;
}

export interface TalukaRecord {
  id: string;
  districtId: string;
  districtName: string;
  stateId: string;
  stateName: string;
  name: string;
  isActive: boolean;
}

export interface VillageRecord {
  id: string;
  talukaId: string;
  talukaName: string;
  districtId: string;
  districtName: string;
  stateId: string;
  stateName: string;
  name: string;
  isActive: boolean;
}

export interface FoddermanOptionRecord {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  mobileNumber: string;
  isActive: boolean;
  districtId: string;
  districtName: string;
  talukaId: string;
  talukaName: string;
}
