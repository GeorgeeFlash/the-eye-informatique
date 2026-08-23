import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.url("DATABASE_URL must be a valid URL"),
  DATABASE_URL_UNPOOLED: z
    .url("DATABASE_URL_UNPOOLED must be a valid URL")
    .optional(),
  CLERK_WEBHOOK_SECRET: z.string().min(1, "CLERK_WEBHOOK_SECRET is required"),
  CLERK_SECRET_KEY: z.string().min(1, "CLERK_SECRET_KEY is required"),
  RESEND_API_KEY: z
    .string()
    .min(1, "RESEND_API_KEY is required")
    .startsWith("re_", "RESEND_API_KEY must start with 're_'"),
  RESEND_FROM_EMAIL: z.string().optional(),
  PAYUNIT_API_KEY: z.string().min(1, "PAYUNIT_API_KEY is required"),
  PAYUNIT_API_USERNAME: z.string().min(1, "PAYUNIT_API_USERNAME is required"),
  PAYUNIT_API_PASSWORD: z.string().min(1, "PAYUNIT_API_PASSWORD is required"),
  PAYUNIT_MODE: z.enum(["test", "live"]).default("test"),
  ARCJET_KEY: z.string().min(1, "ARCJET_KEY is required"),
  INNGEST_EVENT_KEY: z.string().min(1, "INNGEST_EVENT_KEY is required"),
  INNGEST_SIGNING_KEY: z.string().min(1, "INNGEST_SIGNING_KEY is required"),
  INNGEST_DEV: z.string().optional(),
  CONTACT_EMAIL: z.email().optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
  BUILD_ID: z.string().optional(),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  NEXT_RUNTIME: z.enum(["nodejs", "edge"]).optional(),
});

type ServerEnv = z.infer<typeof serverEnvSchema>;

function validateEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse({
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL,
    PAYUNIT_API_KEY: process.env.PAYUNIT_API_KEY,
    PAYUNIT_API_USERNAME: process.env.PAYUNIT_API_USERNAME,
    PAYUNIT_API_PASSWORD: process.env.PAYUNIT_API_PASSWORD,
    PAYUNIT_MODE: process.env.PAYUNIT_MODE,
    ARCJET_KEY: process.env.ARCJET_KEY,
    INNGEST_EVENT_KEY: process.env.INNGEST_EVENT_KEY,
    INNGEST_SIGNING_KEY: process.env.INNGEST_SIGNING_KEY,
    INNGEST_DEV: process.env.INNGEST_DEV,
    CONTACT_EMAIL: process.env.CONTACT_EMAIL,
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
    BUILD_ID: process.env.BUILD_ID,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_RUNTIME: process.env.NEXT_RUNTIME,
  });

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Invalid server environment variables:\n${errors}`);
  }

  return result.data;
}

const env = validateEnv();

export const serverEnv = {
  DATABASE_URL: env.DATABASE_URL,
  DATABASE_URL_UNPOOLED: env.DATABASE_URL_UNPOOLED,
  CLERK_WEBHOOK_SECRET: env.CLERK_WEBHOOK_SECRET,
  CLERK_SECRET_KEY: env.CLERK_SECRET_KEY,
  RESEND_API_KEY: env.RESEND_API_KEY,
  RESEND_FROM_EMAIL:
    env.RESEND_FROM_EMAIL ?? "The Eye Informatique <onboarding@resend.dev>",
  PAYUNIT_API_KEY: env.PAYUNIT_API_KEY,
  PAYUNIT_API_USERNAME: env.PAYUNIT_API_USERNAME,
  PAYUNIT_API_PASSWORD: env.PAYUNIT_API_PASSWORD,
  PAYUNIT_MODE: env.PAYUNIT_MODE,
  ARCJET_KEY: env.ARCJET_KEY,
  INNGEST_EVENT_KEY: env.INNGEST_EVENT_KEY,
  INNGEST_SIGNING_KEY: env.INNGEST_SIGNING_KEY,
  INNGEST_DEV: env.INNGEST_DEV,
  CONTACT_EMAIL: env.CONTACT_EMAIL ?? "contact@theeyeinformatique.cm",
  VERCEL_GIT_COMMIT_SHA: env.VERCEL_GIT_COMMIT_SHA,
  BUILD_ID: env.BUILD_ID,
  NODE_ENV: env.NODE_ENV,
  NEXT_RUNTIME: env.NEXT_RUNTIME,
} as const;

export type { ServerEnv };
