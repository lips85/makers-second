"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (
    email: string,
    password: string
  ) => Promise<{
    error: any;
    data?: any;
    needsEmailConfirmation?: boolean;
  }>;
  signOut: () => Promise<void>;
  signInWithGoogle: () => Promise<{ error: any }>;
  signInAsGuest: () => Promise<{ error: any }>;
  upgradeGuestToUser: (
    email: string,
    password: string
  ) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Supabase 클라이언트가 유효한지 확인
    if (!supabase || !supabase.auth) {
      console.error("Supabase 클라이언트가 초기화되지 않았습니다.");
      setLoading(false);
      return;
    }

    // 초기 세션 가져오기
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
      } catch (error) {
        console.error("세션 가져오기 실패:", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Auth 상태 변화 구독
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      });

      return () => subscription.unsubscribe();
    } catch (error) {
      console.error("Auth 상태 구독 실패:", error);
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!supabase?.auth) {
      return {
        error: new Error("Supabase 클라이언트가 초기화되지 않았습니다."),
      };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // 사용자 친화적 에러 메시지 매핑
    if (error) {
      const errorMessages: Record<string, string> = {
        "Invalid login credentials":
          "이메일 또는 비밀번호가 올바르지 않습니다.",
        "Email not confirmed":
          "이메일 확인이 필요합니다. 이메일을 확인해주세요.",
        "Too many requests":
          "너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요.",
        "User not found": "등록되지 않은 이메일입니다.",
        "Invalid email": "올바른 이메일 주소를 입력해주세요.",
      };

      const friendlyMessage = errorMessages[error.message] || error.message;
      return { error: new Error(friendlyMessage) };
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string) => {
    if (!supabase?.auth) {
      return {
        error: new Error("Supabase 클라이언트가 초기화되지 않았습니다."),
      };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // 개발 환경에서는 이메일 확인을 우회
        emailRedirectTo:
          process.env.NODE_ENV === "development"
            ? `${window.location.origin}/auth/callback`
            : undefined,
      },
    });

    // 개발 환경에서 이메일 확인이 필요한 경우 자동으로 확인 처리
    if (
      process.env.NODE_ENV === "development" &&
      data.user &&
      !data.user.email_confirmed_at
    ) {
      console.log("개발 환경: 이메일 확인 우회 처리");
      // 개발 환경에서는 즉시 로그인 허용
      return { error: null, data, needsEmailConfirmation: false };
    }

    // 회원가입 에러 메시지도 사용자 친화적으로 변환
    if (error) {
      const errorMessages: Record<string, string> = {
        "User already registered": "이미 등록된 이메일입니다.",
        "Password should be at least 6 characters":
          "비밀번호는 최소 6자 이상이어야 합니다.",
        "Invalid email": "올바른 이메일 주소를 입력해주세요.",
        "Signup is disabled": "현재 회원가입이 비활성화되어 있습니다.",
        "Email rate limit exceeded":
          "이메일 전송 한도를 초과했습니다. 잠시 후 다시 시도해주세요.",
      };

      const friendlyMessage = errorMessages[error.message] || error.message;
      return {
        error: new Error(friendlyMessage),
        data,
        needsEmailConfirmation: false,
      };
    }

    return {
      error: null,
      data,
      needsEmailConfirmation: !data.user?.email_confirmed_at,
    };
  };

  const signOut = async () => {
    if (!supabase?.auth) {
      return;
    }
    await supabase.auth.signOut();
  };

  const signInWithGoogle = async () => {
    if (!supabase?.auth) {
      return {
        error: new Error("Supabase 클라이언트가 초기화되지 않았습니다."),
      };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        const errorMessages: Record<string, string> = {
          "OAuth provider not enabled": "Google 로그인이 설정되지 않았습니다.",
          "Invalid OAuth provider": "Google 로그인 설정에 문제가 있습니다.",
          "OAuth callback error": "Google 로그인 중 오류가 발생했습니다.",
        };

        const friendlyMessage = errorMessages[error.message] || error.message;
        return { error: new Error(friendlyMessage) };
      }

      return { error: null };
    } catch (error) {
      return { error: new Error("Google 로그인 중 오류가 발생했습니다.") };
    }
  };

  const signInAsGuest = async () => {
    try {
      // 게스트 사용자 생성 API 호출
      const response = await fetch("/api/auth/guest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("게스트 로그인 실패");
      }

      const { guestAuthId } = await response.json();

      // 로컬 스토리지에 게스트 ID 저장
      localStorage.setItem("guest_auth_id", guestAuthId);

      // 임시 사용자 객체 생성
      const guestUser: User = {
        id: guestAuthId,
        email: `${guestAuthId}@guest.local`,
        user_metadata: {
          name: "게스트 사용자",
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        aud: "authenticated",
        role: "authenticated",
        app_metadata: {
          provider: "guest",
          providers: ["guest"],
        },
      };

      setUser(guestUser);
      setSession({
        access_token: "guest_token",
        refresh_token: "guest_refresh_token",
        user: guestUser,
        expires_at: Math.floor(Date.now() / 1000) + 24 * 60 * 60, // 24시간
        expires_in: 24 * 60 * 60, // 24시간 (초 단위)
        token_type: "bearer",
      });

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const upgradeGuestToUser = async (email: string, password: string) => {
    try {
      const guestAuthId = localStorage.getItem("guest_auth_id");
      if (!guestAuthId) {
        throw new Error("게스트 세션이 없습니다");
      }

      // 새 사용자 계정 생성
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        return { error: signUpError };
      }

      if (data.user) {
        // 게스트 데이터를 새 사용자로 이전
        const response = await fetch("/api/auth/upgrade-guest", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            guestAuthId,
            newAuthId: data.user.id,
            email,
          }),
        });

        if (!response.ok) {
          throw new Error("게스트 데이터 이전 실패");
        }

        // 게스트 ID 제거
        localStorage.removeItem("guest_auth_id");
      }

      return { error: null };
    } catch (error) {
      return { error };
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    signInAsGuest,
    upgradeGuestToUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// 인증이 필요한 컴포넌트를 위한 훅
export function useRequireAuth() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      // 로그인 페이지로 리디렉션
      window.location.href = "/auth/login";
    }
  }, [user, loading]);

  return { user, loading };
}
