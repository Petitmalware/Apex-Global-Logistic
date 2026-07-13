import { z } from "zod";

const PASSWORD_MIN_LENGTH = 12;
const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_REQUIREMENTS = [
  "12 to 128 characters",
  "At least one uppercase letter",
  "At least one lowercase letter",
  "At least one number",
] as const;

const emailSchema = z
  .string({ required_error: "Email is required." })
  .trim()
  .min(1, "Email is required.")
  .email("Email is invalid.")
  .max(255, "Email must be 255 characters or fewer.")
  .toLowerCase();

export const passwordSchema = z
  .string({ required_error: "Password is required." })
  .superRefine((password, context) => {
    if (!password) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password is required.",
      });
      return;
    }

    if (password.length < PASSWORD_MIN_LENGTH) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must be at least 12 characters.",
      });
    }

    if (password.length > PASSWORD_MAX_LENGTH) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must be at most 128 characters.",
      });
    }

    if (!/[A-Z]/.test(password)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must include an uppercase letter.",
      });
    }

    if (!/[a-z]/.test(password)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must include a lowercase letter.",
      });
    }

    if (!/[0-9]/.test(password)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Password must include a number.",
      });
    }
  });

export const registerSchema = z.object({
  email: emailSchema,
  name: z
    .string({ required_error: "Name is required." })
    .trim()
    .min(2, "Name is required.")
    .max(160, "Name must be 160 characters or fewer."),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  token: z.string().trim().min(32),
});

export const verifyEmailSchema = z.object({
  token: z.string().trim().min(32),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
