import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// 동적 환경 변수 로딩 함수
function getSupabaseConfig() {
  // 환경 변수가 없으면 기본값 반환
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    console.warn("Supabase 환경 변수가 설정되지 않았습니다.");
    // 개발 환경에서는 더 명확한 오류 메시지
    if (process.env.NODE_ENV === "development") {
      throw new Error(
        "Supabase 환경 변수가 설정되지 않았습니다. .env.local 파일을 확인해주세요."
      );
    }
    // 프로덕션에서는 기본값 사용
    return {
      url: "https://placeholder.supabase.co",
      anonKey: "placeholder-key",
    };
  }

  return { url, anonKey };
}

// 브라우저용 Supabase 클라이언트 (Auth 포함)
export function createClient() {
  try {
    const config = getSupabaseConfig();
    return createSupabaseClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  } catch (error) {
    console.error("Supabase 클라이언트 생성 실패:", error);
    // 오류 발생 시 더미 클라이언트 반환
    return createSupabaseClient("https://dummy.supabase.co", "dummy-key", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
}

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

// 기본 클라이언트 인스턴스 (클라이언트와 서버 모두에서 사용)
export const supabase = createClient();

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
