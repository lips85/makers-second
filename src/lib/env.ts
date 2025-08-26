import { z } from "zod";

// Server-side environment variables schema
const serverEnvSchema = z.object({
  // Database (server-side only)
  SUPABASE_DB_URL: z.string().url().optional(),

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

// 런타임 환경 변수 로딩 함수
function getRuntimeEnv() {
  if (typeof window !== "undefined") {
    // 클라이언트 사이드: process.env 사용
    return {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NODE_ENV: process.env.NODE_ENV || "development",
      NEXT_PUBLIC_GADS_CLIENT_ID: process.env.NEXT_PUBLIC_GADS_CLIENT_ID,
      NEXT_PUBLIC_FORCE_ADS_DISABLED:
        process.env.NEXT_PUBLIC_FORCE_ADS_DISABLED === "true",
    };
  } else {
    // 서버 사이드: 기존 방식 유지
    return process.env;
  }
}

function validateEnv() {
  try {
    const envVars = getRuntimeEnv();

    // Check if we're on the client side
    if (typeof window !== "undefined") {
      // Client-side: return environment variables directly without validation
      return {
        NEXT_PUBLIC_SUPABASE_URL: envVars.NEXT_PUBLIC_SUPABASE_URL,
        NEXT_PUBLIC_SUPABASE_ANON_KEY: envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        NODE_ENV: envVars.NODE_ENV || "development",
        NEXT_PUBLIC_GADS_CLIENT_ID: envVars.NEXT_PUBLIC_GADS_CLIENT_ID,
        NEXT_PUBLIC_FORCE_ADS_DISABLED: envVars.NEXT_PUBLIC_FORCE_ADS_DISABLED,
      };
    } else {
      // Server-side: validate environment variables
      return serverEnvSchema.parse(envVars);
    }
  } catch (error) {
    console.error("❌ Environment validation failed:", error);
    if (process.env.NODE_ENV === "development") {
      console.error(
        "Please check your .env.local file and ensure all required variables are set."
      );
    }
    throw error;
  }
}

export const env = validateEnv();
