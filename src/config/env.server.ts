import "server-only";
import { z } from "zod";

const serverEnvSchema = z.object({
  AI_PROVIDER: z.enum(["gemini", "groq", "local", "openai", "openrouter"]).default("local"),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(30000),
  AI_SEMANTIC_SEARCH_LIMIT: z.coerce.number().int().positive().max(25).default(8),
  APP_ENV: z.enum(["development", "test", "staging", "production"]).default("development"),
  AUTH_ACCESS_TOKEN_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  AUTH_EMAIL_VERIFICATION_TTL_HOURS: z.coerce.number().int().positive().default(24),
  AUTH_JWT_SECRET: z.string().min(32, "AUTH_JWT_SECRET must be at least 32 characters."),
  AUTH_PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().positive().default(30),
  AUTH_REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(30),
  DATABASE_URL: z.string().url(),
  BREVO_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default("notifications@apexgloballogistics.example"),
  EMAIL_PROVIDER: z.enum(["brevo", "console", "resend", "smtp"]).default("console"),
  EMAIL_RATE_LIMIT_PER_HOUR: z.coerce.number().int().positive().default(60),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default("gemini-1.5-flash"),
  MAPTILER_API_KEY: z.string().optional(),
  GROQ_API_KEY: z.string().optional(),
  GROQ_BASE_URL: z.string().url().default("https://api.groq.com/openai/v1"),
  GROQ_MODEL: z.string().default("llama-3.1-8b-instant"),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NOTIFICATION_EMAIL_FROM: z.string().email().optional(),
  NOTIFICATION_EMAIL_PROVIDER: z.enum(["console", "resend", "sendgrid", "smtp"]).default("console"),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().default("https://api.openai.com/v1"),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
  OPENROUTER_API_KEY: z.string().optional(),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  OPENROUTER_MODEL: z.string().default("openai/gpt-4o-mini"),
  REDIS_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().optional(),
  SECURITY_ACTION_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(60),
  SECURITY_AI_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(30),
  SECURITY_API_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(120),
  SECURITY_AUTH_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(20),
  SECURITY_EMAIL_SEND_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(10),
  SECURITY_LOGIN_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(10),
  SECURITY_PUBLIC_TRACKING_RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(60),
  SMTP_FROM: z.string().email().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_USERNAME: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ENDPOINT: z.string().url().optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(true),
  S3_PUBLIC_URL: z.string().url().optional(),
  S3_REGION: z.string().default("us-east-1"),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  STORAGE_DRIVER: z.enum(["local", "s3"]).default("local"),
  STORAGE_LOCAL_PATH: z.string().default("storage"),
  SUPPORT_EMAIL: z.string().email().default("support@apexgloballogistics.example"),
  SUPPORT_SMTP_PASSWORD: z.string().optional(),
  SUPPORT_SMTP_USERNAME: z.string().email().optional(),
  SUPPORT_PHONE: z.string().default(""),
});

const parsedServerEnv = serverEnvSchema.safeParse(process.env);

if (!parsedServerEnv.success) {
  console.error(
    "Invalid server environment variables",
    parsedServerEnv.error.flatten().fieldErrors,
  );
  throw new Error("Invalid server environment variables");
}

export const env = parsedServerEnv.data;
export type ServerEnv = z.infer<typeof serverEnvSchema>;
