import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase'
import { 
  validateCodeFormat, 
  normalizeErrorMessage,
  ClassCodeSchema 
} from '@/lib/classroom/code-utils'

// 요청 스키마
const JoinCodeSchema = z.object({
  code: ClassCodeSchema
})

// 세션 데이터 스키마
const SessionDataSchema = z.object({
  orgId: z.string().uuid(),
  orgName: z.string(),
  expiresAt: z.string().datetime(),
  adsHidden: z.boolean()
})

// 쿠키 설정
const SESSION_COOKIE_NAME = 'org_session'
const SESSION_MAX_AGE = 8 * 60 * 60 // 8시간 (초 단위)

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json()
    const parseResult = JoinCodeSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || '잘못된 코드 형식입니다'
        },
        { status: 400 }
      )
    }

    const { code } = parseResult.data
    const upperCode = code.toUpperCase()

    // 코드 형식 검증
    const formatValidation = validateCodeFormat(upperCode)
    if (!formatValidation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: formatValidation.error
        },
        { status: 400 }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createClient()

    // 데이터베이스에서 코드 검증 (RPC 함수 사용)
    const { data: validationResult, error: validationError } = await supabase
      .rpc('validate_org_code', { code_input: upperCode })
      .single()

    if (validationError) {
      console.error('코드 검증 오류:', validationError)
      return NextResponse.json(
        {
          success: false,
          error: '코드 검증 중 오류가 발생했습니다'
        },
        { status: 500 }
      )
    }

    if (!validationResult.is_valid) {
      const errorMessage = normalizeErrorMessage(validationResult.error_message || 'Invalid code')
      return NextResponse.json(
        {
          success: false,
          error: errorMessage
        },
        { status: 400 }
      )
    }

    // 조직 정보 조회
    const { data: orgInfo, error: orgError } = await supabase
      .from('orgs')
      .select('id, name, settings')
      .eq('id', validationResult.org_id)
      .single()

    if (orgError || !orgInfo) {
      console.error('조직 정보 조회 오류:', orgError)
      return NextResponse.json(
        {
          success: false,
          error: '조직 정보를 찾을 수 없습니다'
        },
        { status: 404 }
      )
    }

    // 세션 데이터 생성
    const sessionData = {
      orgId: validationResult.org_id,
      orgName: orgInfo.name,
      expiresAt: validationResult.expires_at,
      adsHidden: true, // 교실 참여 시 광고 숨김
      joinedAt: new Date().toISOString()
    }

    // 세션 검증
    const sessionValidation = SessionDataSchema.safeParse(sessionData)
    if (!sessionValidation.success) {
      console.error('세션 데이터 검증 실패:', sessionValidation.error)
      return NextResponse.json(
        {
          success: false,
          error: '세션 생성에 실패했습니다'
        },
        { status: 500 }
      )
    }

    // 쿠키 설정
    const cookieStore = cookies()
    const cookieValue = JSON.stringify(sessionData)
    
    // 만료 시간 계산 (코드 만료 시간과 최대 세션 시간 중 더 짧은 것)
    const codeExpiresAt = new Date(validationResult.expires_at)
    const maxSessionExpiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000)
    const actualExpiresAt = codeExpiresAt < maxSessionExpiresAt ? codeExpiresAt : maxSessionExpiresAt
    
    cookieStore.set(SESSION_COOKIE_NAME, cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: actualExpiresAt,
      path: '/'
    })

    // 참여 로그 기록 (선택사항)
    try {
      await supabase
        .from('org_sessions')
        .insert({
          org_id: validationResult.org_id,
          code: upperCode,
          joined_at: new Date().toISOString(),
          expires_at: validationResult.expires_at,
          user_agent: request.headers.get('user-agent') || '',
          ip_address: request.ip || ''
        })
    } catch (logError) {
      // 로그 실패는 치명적이지 않음
      console.warn('참여 로그 기록 실패:', logError)
    }

    // 성공 응답
    return NextResponse.json(
      {
        success: true,
        data: {
          orgId: validationResult.org_id,
          orgName: orgInfo.name,
          expiresAt: validationResult.expires_at,
          adsHidden: true,
          joinedAt: sessionData.joinedAt
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('joinCode API 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다'
      },
      { status: 500 }
    )
  }
}

// GET 메서드: 현재 세션 상태 조회
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)

    if (!sessionCookie) {
      return NextResponse.json({
        success: true,
        data: {
          isActive: false,
          session: null
        }
      })
    }

    let sessionData
    try {
      sessionData = JSON.parse(sessionCookie.value)
    } catch (parseError) {
      // 잘못된 쿠키 형식 - 쿠키 삭제
      cookieStore.delete(SESSION_COOKIE_NAME)
      return NextResponse.json({
        success: true,
        data: {
          isActive: false,
          session: null
        }
      })
    }

    // 세션 만료 확인
    const now = new Date()
    const expiresAt = new Date(sessionData.expiresAt)
    
    if (now >= expiresAt) {
      // 만료된 세션 - 쿠키 삭제
      cookieStore.delete(SESSION_COOKIE_NAME)
      return NextResponse.json({
        success: true,
        data: {
          isActive: false,
          session: null,
          expired: true
        }
      })
    }

    // 활성 세션
    return NextResponse.json({
      success: true,
      data: {
        isActive: true,
        session: {
          orgId: sessionData.orgId,
          orgName: sessionData.orgName,
          expiresAt: sessionData.expiresAt,
          adsHidden: sessionData.adsHidden,
          joinedAt: sessionData.joinedAt
        }
      }
    })

  } catch (error) {
    console.error('joinCode GET API 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '세션 상태 확인 중 오류가 발생했습니다'
      },
      { status: 500 }
    )
  }
}

// DELETE 메서드: 세션 종료 (교실 나가기)
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies()
    
    // 쿠키 삭제
    cookieStore.delete(SESSION_COOKIE_NAME)

    return NextResponse.json({
      success: true,
      data: {
        message: '교실에서 나왔습니다'
      }
    })

  } catch (error) {
    console.error('joinCode DELETE API 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '세션 종료 중 오류가 발생했습니다'
      },
      { status: 500 }
    )
  }
}
