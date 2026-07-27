import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_MAP_AERIAL_STYLE_URL: z.string().url().optional(),
  NEXT_PUBLIC_MAP_DARK_STYLE_URL: z.string().url().optional(),
  NEXT_PUBLIC_MAPTILER_API_KEY: z.string().optional(),
  NEXT_PUBLIC_MAP_TERRAIN_STYLE_URL: z.string().url().optional(),
});

export const clientEnv = clientEnvSchema.parse({
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_MAP_AERIAL_STYLE_URL: process.env.NEXT_PUBLIC_MAP_AERIAL_STYLE_URL,
  NEXT_PUBLIC_MAP_DARK_STYLE_URL: process.env.NEXT_PUBLIC_MAP_DARK_STYLE_URL,
  NEXT_PUBLIC_MAPTILER_API_KEY: process.env.NEXT_PUBLIC_MAPTILER_API_KEY,
  NEXT_PUBLIC_MAP_TERRAIN_STYLE_URL: process.env.NEXT_PUBLIC_MAP_TERRAIN_STYLE_URL,
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
