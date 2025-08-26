import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // 클라이언트에서 필요한 환경 변수만 제공
  const clientEnv = {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_GADS_CLIENT_ID: process.env.NEXT_PUBLIC_GADS_CLIENT_ID,
    NEXT_PUBLIC_FORCE_ADS_DISABLED: process.env.NEXT_PUBLIC_FORCE_ADS_DISABLED,
  };

  return NextResponse.json(clientEnv);
}
