import { useState, useEffect } from "react";

interface ClientEnv {
  NEXT_PUBLIC_SUPABASE_URL: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
  NEXT_PUBLIC_GADS_CLIENT_ID?: string;
  NEXT_PUBLIC_FORCE_ADS_DISABLED?: boolean;
}

export function useClientEnv() {
  const [env, setEnv] = useState<ClientEnv | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadEnv() {
      try {
        // 개발 환경에서는 process.env 사용
        if (process.env.NODE_ENV === "development") {
          setEnv({
            NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL!,
            NEXT_PUBLIC_SUPABASE_ANON_KEY:
              process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            NEXT_PUBLIC_GADS_CLIENT_ID: process.env.NEXT_PUBLIC_GADS_CLIENT_ID,
            NEXT_PUBLIC_FORCE_ADS_DISABLED:
              process.env.NEXT_PUBLIC_FORCE_ADS_DISABLED === "true",
          });
        } else {
          // 프로덕션에서는 API에서 로딩
          const response = await fetch("/api/env");
          if (!response.ok) {
            throw new Error("Failed to load environment variables");
          }
          const envData = await response.json();
          setEnv(envData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    }

    loadEnv();
  }, []);

  return { env, loading, error };
}
