import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

export async function POST() {
  try {
    const supabase = createClient()

    // 게스트 사용자 생성
    const { data, error } = await supabase.rpc('create_guest_user')

    if (error) {
      console.error('게스트 사용자 생성 오류:', error)
      return NextResponse.json(
        { 
          error: '게스트 사용자 생성에 실패했습니다',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ guestAuthId: data })
  } catch (error) {
    console.error('게스트 사용자 생성 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
