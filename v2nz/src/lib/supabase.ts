import { createClient as createSupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// 브라우저용 Supabase 클라이언트 (Auth 포함)
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// 서버 사이드에서 사용할 수 있는 createClient 함수
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Auth 타입 정의
export type AuthUser = {
  id: string
  email?: string
  user_metadata?: {
    name?: string
    avatar_url?: string
  }
  created_at: string
  updated_at: string
}

export type AuthSession = {
  access_token: string
  refresh_token: string
  user: AuthUser
  expires_at: number
}
