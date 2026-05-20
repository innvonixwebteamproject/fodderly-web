import { z } from "zod";
import { COMPANY_TYPE_OPTIONS } from "./constants";

const nameRegex = /^[A-Za-z\s]+$/;
const mobileRegex = /^[0-9]{10}$/;
const gstRegex = /^[A-Z0-9]{15}$/;
const cinRegex = /^[A-Z0-9]{21}$/;
const allowedCertificateTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
const maxCertificateSizeBytes = 5 * 1024 * 1024;

const getPartnerNameSchema = (label: "First Name" | "Last Name") =>
  z
    .string()
    .trim()
    .nonempty(`${label} is required.`)
    .min(2, `${label} must be at least 2 characters long.`)
    .max(50, `${label} cannot exceed 50 characters.`)
    .regex(nameRegex, "Only letters and spaces allowed.");

export const partnerSchema = z.object({
  firstName: getPartnerNameSchema("First Name"),
  lastName: getPartnerNameSchema("Last Name"),
  email: z
    .string()
    .trim()
    .nonempty("Email is required.")
    .email("Invalid email format."),
  phone: z
    .string()
    .trim()
    .nonempty("Mobile Number is required.")
    .regex(mobileRegex, "Mobile Number must be 10 digits."),
  stateId: z.string().trim().nonempty("State is required."),
  districtIds: z.array(z.string()).min(1, "Please select at least one district."),
  companyType: z.enum(
    COMPANY_TYPE_OPTIONS.map((item) => item.value) as ["pvt", "llp"],
    {
      errorMap: () => ({ message: "Please select Company Type." }),
    },
  ),
  companyName: z
    .string()
    .trim()
    .nonempty("Company Name is required,")
    .min(2, "Company Name must be at least 2 characters long.")
    .max(100, "Company Name cannot exceed 100 characters."),
  companyCertificate: z
    .custom<File | string>((value) => value instanceof File || typeof value === "string", {
      message: "Certificate upload is required",
    })
    .refine((value) => {
      if (typeof value === "string") return value.trim().length > 0;
      return true;
    }, "Certificate upload is required")
    .refine((value) => {
      if (!(value instanceof File)) return true;
      return allowedCertificateTypes.includes(value.type);
    }, "Invalid file format. Please upload PDF, JPG, or PNG")
    .refine((value) => {
      if (!(value instanceof File)) return true;
      return value.size <= maxCertificateSizeBytes;
    }, "File size exceeds the permitted limit."),
  gstNumber: z
    .string()
    .trim()
    .nonempty("GST Number is required,")
    .regex(gstRegex, "Please enter a valid 15-character GST Number."),
  cinNumber: z
    .string()
    .trim()
    .nonempty("CIN Number is required,")
    .regex(cinRegex, "Please enter a valid 21-character CIN Number."),
});

export type PartnerSchemaType = z.infer<typeof partnerSchema>;

export interface IPartner {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  role?: string;
  isActive: boolean;
  forcePasswordChange: boolean;
  districtIds: string[];
  districts?: IPartnerDistrict[];
  state?: IPartnerState | null;
  companyType?: "pvt" | "llp";
  companyName: string;
  companyCertificate: string;
  gstNumber: string;
  cinNumber: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface IPartnerState {
  id: string;
  name: string;
  isActive?: boolean;
}

export interface IPartnerDistrict {
  id: string;
  stateId: string;
  name: string;
  isActive?: boolean;
}
