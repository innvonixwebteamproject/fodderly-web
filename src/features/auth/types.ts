import { z } from "zod";

const nameRegex = /^[A-Za-z\s]+$/;

/**
 * LOGIN FORM TYPES
 */
export const getSigninSchema = () => {
  return z.object({
    email: z
      .string()
      .nonempty({ message: "Email is required." })
      .email({ message: "Please enter a valid email address." })
      .min(1, { message: "Email is required." }),
    password: z
      .string()
      .nonempty({ message: "Password is required." }),
    rememberMe: z.boolean().optional(),
  });
};

export type SigninSchemaType = z.infer<ReturnType<typeof getSigninSchema>>;

/**
 * EDIT PROFILE FORM TYPES
 */
const getRequiredNameSchema = (label: "First Name" | "Last Name") =>
  z
    .string()
    .trim()
    .nonempty({ message: `${label} is required.` })
    .min(2, { message: `${label} must be at least 2 characters long.` })
    .max(50, { message: `${label} cannot exceed 50 characters.` })
    .regex(nameRegex, {
      message: "Only letters and spaces allowed.",
    });

const getOptionalNameSchema = (label: "First Name" | "Last Name") =>
  z
    .string()
    .trim()
    .refine((value) => value === "" || value.length >= 2, {
      message: `${label} must be at least 2 characters long.`,
    })
    .refine((value) => value === "" || value.length <= 50, {
      message: `${label} cannot exceed 50 characters.`,
    })
    .refine((value) => value === "" || nameRegex.test(value), {
      message: "Only letters and spaces allowed.",
    });

export const getEditProfileSchema = (role: UserRole = "partner") => {
  return z.object({
    email: z
      .string()
      .trim()
      .nonempty({ message: "Email is required." })
      .email({ message: "Please enter a valid email address." }),
    firstName: getRequiredNameSchema("First Name"),
    lastName:
      role === "admin"
        ? getOptionalNameSchema("Last Name")
        : getRequiredNameSchema("Last Name"),
  });
};

export type EditProfileSchemaType = z.infer<ReturnType<typeof getEditProfileSchema>>;


/**
 * AUTH API REQUEST/RESPONSE TYPES
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: "Bearer";
}



export interface LoginRequest {
  email: string;
  password: string;
  fcmToken?: string;
}

export type UserRole = "admin" | "partner";

export interface LoginResponseData extends AuthTokens {
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  id: string;
  role: UserRole;
  forcePasswordChange: boolean;
  isActive: boolean;
}

export interface LoginResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: LoginResponseData;
  timestamp: string;
}

/**
 * AUTH SESSION STATE
 */
export interface AuthSession {
  accessToken: string | null;
  refreshToken: string | null;
  expiresIn: number | null;
  tokenType: "Bearer" | null;
  role: UserRole | null;
  forcePasswordChange: boolean;
  isActive: boolean;
  isAuthenticated: boolean;
  userEmail: string | null;
  userName: string | null;
  userId: string | null;
}

export interface UserData {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  email: string;
  phone?: string | { value?: string } | null;
  stateId?: string;
  districtIds?: string[];
  state?: {
    id: string;
    name: string;
  } | null;
  districts?: Array<{
    id: string;
    stateId: string;
    name: string;
  }>;
  company?: {
    company_name?: string;
    company_type?: string;
    gst_number?: string;
    cin_number?: string;
    company_certificate?: string;
  } | null;
  companyName?: string;
  companyType?: string;
  gstNumber?: string;
  cinNumber?: string;
  role?: string;
  isActive?: boolean;
  forcePasswordChange?: boolean;
  createdAt?: string;
  updatedAt?: string;
  profile?: string | null;
  skills?: unknown[];
}

export interface UserProfileResponse {
  success: boolean;
  statusCode: number;
  message: string;
  data: UserData;
  timestamp: string;
}

export type UserProfile = UserProfileResponse;

