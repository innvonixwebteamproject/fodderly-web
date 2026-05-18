import { z } from "zod";

export enum ContactPersonType {
  TECHNICAL = "TECHNICAL",
  PURCHASE = "PURCHASE",
}

export const contactPersonSchema = z.object({
  name: z
    .string()
    .trim()
    .nonempty("Name is required.")
    .min(2, "Name must be at least 2 characters.")
    .max(50, "Name cannot exceed 50 characters.")
    .refine(
    (val) => !/^\d+$/.test(val),
    "Name cannot be numbers only."
  ),

  email: z
    .string()
    .nonempty("Email is required.")
    .email("Please enter a valid email address."),

  country_code: z.string().nonempty("Country code is required."),

  phone: z
    .string()
    .nonempty("Phone number is required.")
    .refine((val) => !val || /^[0-9]{7,15}$/.test(val), {
      message: "Please enter a valid phone number (7-15 digits).",
    }),

  type: z.nativeEnum(ContactPersonType, {
    required_error: "Contact person type is required.",
  }),
  id: z.string().optional(),
});

export type ContactPerson = z.infer<typeof contactPersonSchema>;

export const plantSchema = z.object({
  plant_name: z
    .string()
    .trim()
    .nonempty("Plant name is required.")
    .min(2, "Plant name must be at least 2 characters.")
    .max(255, "Plant name cannot exceed 255 characters."),

  city: z
    .string()
    .trim()
    .nonempty("City is required.")
    .min(2, "City must be at least 2 characters.")
    .max(255, "City cannot exceed 255 characters."),

  plant_location: z
    .string()
    .trim()
    .max(255, "Plant location cannot exceed 255 characters.")
    .url("Please enter a valid URL.")
    .or(z.literal(""))
    .optional()
    .transform((val) => (val === "" ? undefined : val)),
  id: z.string().optional(),
});

export type PlantSchemaType = z.infer<typeof plantSchema>;

export const clientSchema = z.object({
  client_name: z
    .string()
    .trim()
    .nonempty("Client name is required.")
    .min(2, "Client name must be at least 2 characters.")
    .max(255, "Client name cannot exceed 255 characters.")
    .refine(
    (val) => !/^\d+$/.test(val),
    "Client name cannot be numbers only."
  ),

  company_details: z
    .string()
    .nonempty("Company details are required.")
    .min(2, "Company details must be at least 2 characters.")
    .max(1000, "Company details cannot exceed 1000 characters."),

  address: z
    .string()
    .nonempty("Address is required.")
    .min(2, "Address must be at least 2 characters.")
    .max(1000, "Address cannot exceed 1000 characters."),

  contact_persons: z
    .array(contactPersonSchema)
    .min(1, "At least one contact person is required."),

  plants: z.array(plantSchema).min(1, "At least one plant is required."),
});

export type ClientSchemaType = z.infer<typeof clientSchema>;

export interface IPlant extends PlantSchemaType {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  client_id?: string;
  deletedAt?: string | null;
}

export interface IClient extends Omit<ClientSchemaType, "plants"> {
  id: string;
  is_active: boolean;
  createdAt: string;
  updatedAt: string;
  plants: IPlant[];
}
