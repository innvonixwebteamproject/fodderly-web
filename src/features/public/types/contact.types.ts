import { z } from "zod";

export const contactUsSchema = z.object({
  name: z
    .string()
    .trim()
    .nonempty("Name is required.")
    .min(2, "Name must be at least 2 characters."),
  email: z
    .string()
    .trim()
    .nonempty("Email is required.")
    .email("Please enter a valid email address."),
  phone: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[0-9+]{7,15}$/.test(val), {
      message: "Please enter a valid phone number (7-15 digits).",
    }),
  subject: z
    .string()
    .trim()
    .nonempty("Subject is required.")
    .min(3, "Subject must be at least 3 characters."),
  message: z
    .string()
    .trim()
    .nonempty("Message is required.")
    .min(10, "Message must be at least 10 characters."),
});

export type ContactUsRequest = z.infer<typeof contactUsSchema>;
