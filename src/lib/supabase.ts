import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// 동적 환경 변수 로딩 함수
function getSupabaseConfig() {
  // 서버 사이드에서는 process.env 사용
  if (typeof window === "undefined") {
    return {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    };
  }

  // 클라이언트 사이드에서는 window.__ENV__ 또는 process.env 사용
  return {
    url:
      (window as any).__ENV__?.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey:
      (window as any).__ENV__?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  };
}

// 브라우저용 Supabase 클라이언트 (Auth 포함)
export function createClient() {
  const config = getSupabaseConfig();
  return createSupabaseClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}

// 기본 클라이언트 인스턴스 (서버 사이드에서만 사용)
export const supabase = typeof window === "undefined" ? createClient() : null;

// 서버 사이드에서 사용할 수 있는 createClient 함수
export function createServerClient() {
  const config = getSupabaseConfig();
  return createSupabaseClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

// Auth 타입 정의
export type AuthUser = {
  id: string;
  email?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
  created_at: string;
  updated_at: string;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
  expires_at: number;
};
