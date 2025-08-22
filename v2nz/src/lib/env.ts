import { z } from "zod";

const envSchema = z.object({
  // Database
  SUPABASE_DB_URL: z.string().url(),

  // Supabase Client
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),

  // Environment
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  SEED_ENABLED: z
    .string()
    .optional()
    .transform((val) => val === "true"),

  // Database Connection Pool (optional)
  DB_POOL_MIN: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 2)),
  DB_POOL_MAX: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10)),
  DB_POOL_IDLE_TIMEOUT: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 30000)),

  // Ads Configuration
  NEXT_PUBLIC_GADS_CLIENT_ID: z.string().optional(),
  NEXT_PUBLIC_FORCE_ADS_DISABLED: z
    .string()
    .optional()
    .transform((val) => val === "true"),
});

function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error("❌ Invalid environment variables:");
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join(".")}: ${err.message}`);
      });
      process.exit(1);
    }
    throw error;
  }
}

export const env = validateEnv();
