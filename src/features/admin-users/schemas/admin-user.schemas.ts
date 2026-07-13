import { z } from "zod";

import { passwordSchema } from "@/features/auth/schemas/auth.schemas";

export const createAdminUserSchema = z.object({
  email: z
    .string({ required_error: "Email is required." })
    .trim()
    .min(1, "Email is required.")
    .email("Email is invalid.")
    .max(255, "Email must be 255 characters or fewer.")
    .toLowerCase(),
  name: z
    .string({ required_error: "Name is required." })
    .trim()
    .min(2, "Name is required.")
    .max(160, "Name must be 160 characters or fewer."),
  password: passwordSchema,
});

export type CreateAdminUserInput = z.infer<typeof createAdminUserSchema>;
