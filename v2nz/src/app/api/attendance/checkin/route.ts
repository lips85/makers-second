import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'
import { z } from 'zod'

// 요청 스키마
const CheckinRequestSchema = z.object({
  attendDate: z.string().optional() // ISO 날짜 문자열, 미제공 시 현재 날짜 사용
})

// 응답 스키마
const CheckinResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    isNew: z.boolean(),
    attendDate: z.string(),
    streakBefore: z.number(),
    streakAfter: z.number(),
    rewardPoints: z.number(),
    totalPoints: z.number()
  }).optional(),
  error: z.string().optional()
})

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. 요청 데이터 파싱 및 검증
    const body = await request.json()
    const parseResult = CheckinRequestSchema.safeParse(body)
    
    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: '잘못된 요청 데이터입니다'
        },
        { status: 400 }
      )
    }

    // 2. 사용자 인증 확인
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: '인증이 필요합니다'
        },
        { status: 401 }
      )
    }

    // 3. 사용자 ID 조회
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json(
        {
          success: false,
          error: '사용자 정보를 찾을 수 없습니다'
        },
        { status: 404 }
      )
    }

    // 4. 출석 날짜 결정 (KST 기준)
    let attendDate: string
    if (parseResult.data.attendDate) {
      attendDate = parseResult.data.attendDate
    } else {
      // 현재 KST 날짜 계산
      const now = new Date()
      const kstOffset = 9 * 60 // KST는 UTC+9
      const kstTime = new Date(now.getTime() + kstOffset * 60 * 1000)
      attendDate = kstTime.toISOString().split('T')[0] // YYYY-MM-DD 형식
    }

    // 5. 출석 체크 함수 호출 (Supabase RPC)
    const { data: checkinResult, error: checkinError } = await supabase
      .rpc('check_attendance', {
        p_user_id: userRecord.id,
        p_attend_date: attendDate
      })
      .single()

    if (checkinError) {
      console.error('출석 체크 오류:', checkinError)
      return NextResponse.json(
        {
          success: false,
          error: '출석 체크 중 오류가 발생했습니다'
        },
        { status: 500 }
      )
    }

    // 6. 응답 데이터 검증
    const responseData = {
      isNew: checkinResult.is_new,
      attendDate: checkinResult.attend_date,
      streakBefore: checkinResult.streak_before,
      streakAfter: checkinResult.streak_after,
      rewardPoints: checkinResult.reward_points,
      totalPoints: checkinResult.total_points
    }

    const responseValidation = CheckinResponseSchema.safeParse({
      success: true,
      data: responseData
    })

    if (!responseValidation.success) {
      console.error('응답 데이터 검증 실패:', responseValidation.error)
      return NextResponse.json(
        {
          success: false,
          error: '응답 데이터 형식 오류'
        },
        { status: 500 }
      )
    }

    // 7. 성공 응답
    return NextResponse.json(responseValidation.data, { status: 200 })

  } catch (error) {
    console.error('출석 체크 API 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다'
      },
      { status: 500 }
    )
  }
}

// GET 메서드: 사용자 출석 통계 조회
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. 사용자 인증 확인
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: '인증이 필요합니다'
        },
        { status: 401 }
      )
    }

    // 2. 사용자 ID 조회
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('auth_id', user.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json(
        {
          success: false,
          error: '사용자 정보를 찾을 수 없습니다'
        },
        { status: 404 }
      )
    }

    // 3. 출석 통계 조회
    const { data: stats, error: statsError } = await supabase
      .from('user_attendance_stats')
      .select('*')
      .eq('user_id', userRecord.id)
      .single()

    if (statsError && statsError.code !== 'PGRST116') { // PGRST116는 데이터 없음
      console.error('출석 통계 조회 오류:', statsError)
      return NextResponse.json(
        {
          success: false,
          error: '출석 통계 조회 중 오류가 발생했습니다'
        },
        { status: 500 }
      )
    }

    // 4. 성공 응답
    return NextResponse.json({
      success: true,
      data: stats || {
        user_id: userRecord.id,
        total_attendance_days: 0,
        max_streak: 0,
        total_reward_points: 0,
        last_attendance_date: null
      }
    }, { status: 200 })

  } catch (error) {
    console.error('출석 통계 API 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다'
      },
      { status: 500 }
    )
  }
}
