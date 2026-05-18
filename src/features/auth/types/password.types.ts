import { z } from "zod";

/**
 * Common password validation rules
 */
export const passwordRules = z
  .string()
  .min(1, { message: "Password is required." })
  .min(8, { message: "Password must be at least 8 characters." })
  .max(30, { message: "Password must not exceed 30 characters." })
  .regex(/^\S+$/, {
    message: "Password cannot contain spaces.",
  })
  .regex(/[A-Z]/, {
    message: "Password must contain at least one uppercase letter.",
  })
  .regex(/[a-z]/, {
    message: "Password must contain at least one lowercase letter.",
  })
  .regex(/[0-9]/, {
    message: "Password must contain at least one number.",
  })
  .regex(/[^A-Za-z0-9]/, {
    message: "Password must contain at least one special character.",
  });

/**
 * FORCE CHANGE PASSWORD FORM TYPES
 * Used when user is not onboarded
 */
export const getForceChangePasswordSchema = () => {
  return z
    .object({
      newPassword: passwordRules,
      confirmPassword: z
        .string()
        .min(1, { message: "Please confirm your password." }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });
};

export type ForceChangePasswordSchemaType = z.infer<
  ReturnType<typeof getForceChangePasswordSchema>
>;

/**
 * CHANGE PASSWORD FORM TYPES
 * Used for regular profile password update
 */
export const getChangePasswordSchema = () => {
  return z
    .object({
      currentPassword: z
        .string()
        .min(1, { message: "Current password is required." }),
      newPassword: passwordRules,
      confirmPassword: z
        .string()
        .min(1, { message: "Please confirm your password." }),
    })
    .refine((data) => data.newPassword === data.confirmPassword, {
      message: "Passwords don't match",
      path: ["confirmPassword"],
    });
};

export type ChangePasswordSchemaType = z.infer<
  ReturnType<typeof getChangePasswordSchema>
>;

/**
 * FORGOT PASSWORD FORM TYPES
 */
export const getForgotPasswordSchema = () => {
   return z.object({
    email: z
      .string()
      .nonempty({ message: "Email is required." }) 
      .email({ message: "Please enter a valid email address." }),
  });
};

export type ForgotPasswordSchemaType = z.infer<
  ReturnType<typeof getForgotPasswordSchema>
>;

/**
 * RESET PASSWORD FORM TYPES
 */
export const getResetPasswordSchema = () => {
  return z
    .object({
      password: passwordRules,
      confirmPassword: z
        .string()
        .nonempty({ message: "Please confirm your new password." }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Passwords do not match. Please re-enter.",
      path: ["confirmPassword"],
    });
};

export type ResetPasswordSchemaType = z.infer<
  ReturnType<typeof getResetPasswordSchema>
>;
