import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase'

/**
 * 만료된 교실 코드 정리 API
 * - Cron job이나 주기적 작업에서 호출
 * - 만료된 코드들을 비활성화
 */
export async function POST(request: NextRequest) {
  try {
    // 간단한 인증 체크 (실제로는 더 강력한 인증 필요)
    const authHeader = request.headers.get('authorization')
    const expectedToken = process.env.CLEANUP_API_TOKEN
    
    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        {
          success: false,
          error: '인증이 필요합니다'
        },
        { status: 401 }
      )
    }

    const supabase = createClient()

    // Supabase에서 정의한 cleanup 함수 호출
    const { data: deletedCount, error } = await supabase
      .rpc('cleanup_expired_org_codes')

    if (error) {
      console.error('코드 정리 오류:', error)
      return NextResponse.json(
        {
          success: false,
          error: '코드 정리 중 오류가 발생했습니다'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        cleanedUpCount: deletedCount || 0,
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('cleanupCodes API 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다'
      },
      { status: 500 }
    )
  }
}

/**
 * 현재 만료된 코드 수 조회 (GET)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // 만료된 코드 수 조회
    const { count: expiredCount, error: expiredError } = await supabase
      .from('org_codes')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .lt('expires_at', new Date().toISOString())

    if (expiredError) {
      console.error('만료 코드 조회 오류:', expiredError)
      return NextResponse.json(
        {
          success: false,
          error: '만료 코드 조회 중 오류가 발생했습니다'
        },
        { status: 500 }
      )
    }

    // 활성 코드 수 조회
    const { count: activeCount, error: activeError } = await supabase
      .from('org_codes')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())

    if (activeError) {
      console.error('활성 코드 조회 오류:', activeError)
      return NextResponse.json(
        {
          success: false,
          error: '활성 코드 조회 중 오류가 발생했습니다'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        expiredCodes: expiredCount || 0,
        activeCodes: activeCount || 0,
        totalCodes: (expiredCount || 0) + (activeCount || 0),
        timestamp: new Date().toISOString()
      }
    })

  } catch (error) {
    console.error('cleanupCodes GET API 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다'
      },
      { status: 500 }
    )
  }
}
