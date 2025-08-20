import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { z } from 'zod'

const UpgradeGuestSchema = z.object({
  guestAuthId: z.string(),
  newAuthId: z.string(),
  email: z.string().email()
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { guestAuthId, newAuthId, email } = UpgradeGuestSchema.parse(body)

    const supabase = createClient()

    // 게스트 사용자를 정식 사용자로 업그레이드
    const { data, error } = await supabase.rpc('upgrade_guest_to_user', {
      guest_auth_id: guestAuthId,
      new_auth_id: newAuthId,
      new_email: email
    })

    if (error) {
      console.error('게스트 업그레이드 오류:', error)
      return NextResponse.json(
        { error: '게스트 사용자 업그레이드에 실패했습니다' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('게스트 업그레이드 예외:', error)
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    )
  }
}
