import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase'
import { 
  generateClassCode, 
  validateTTL, 
  calculateExpiresAt,
  TTLSchema 
} from '@/lib/classroom/code-utils'

// 요청 스키마
const GenerateCodeSchema = z.object({
  ttlMinutes: TTLSchema,
  orgId: z.string().uuid('유효한 조직 ID가 필요합니다')
})

// 응답 스키마
const GenerateCodeResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    code: z.string(),
    expiresAt: z.string().datetime(),
    orgId: z.string().uuid(),
    ttlMinutes: z.number()
  }).optional(),
  error: z.string().optional()
})

// 레이트 리밋 (간단한 인메모리 구현)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1분
const MAX_REQUESTS_PER_WINDOW = 10 // 1분에 최대 10개 코드 생성

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const now = Date.now()
  const userLimit = rateLimitMap.get(userId)

  if (!userLimit || now > userLimit.resetTime) {
    // 새로운 윈도우 시작
    rateLimitMap.set(userId, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1 }
  }

  if (userLimit.count >= MAX_REQUESTS_PER_WINDOW) {
    return { allowed: false, remaining: 0 }
  }

  userLimit.count++
  return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - userLimit.count }
}

export async function POST(request: NextRequest) {
  try {
    // 요청 본문 파싱
    const body = await request.json()
    const parseResult = GenerateCodeSchema.safeParse(body)

    if (!parseResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: parseResult.error.issues[0]?.message || '잘못된 요청 데이터입니다'
        },
        { status: 400 }
      )
    }

    const { ttlMinutes, orgId } = parseResult.data

    // Supabase 클라이언트 생성
    const supabase = createClient()

    // 사용자 인증 확인
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

    // 레이트 리밋 확인
    const rateLimit = checkRateLimit(user.id)
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.'
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'Retry-After': '60'
          }
        }
      )
    }

    // 사용자가 해당 조직의 교사/관리자인지 확인
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('auth_id, org_id, role')
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

    // 권한 확인: 교사(teacher) 또는 관리자(admin)만 코드 생성 가능
    if (!['teacher', 'admin'].includes(userRecord.role)) {
      return NextResponse.json(
        {
          success: false,
          error: '교사 또는 관리자만 교실 코드를 생성할 수 있습니다'
        },
        { status: 403 }
      )
    }

    // 조직 확인: 사용자가 속한 조직과 요청한 조직이 일치하는지 확인
    if (userRecord.org_id !== orgId) {
      return NextResponse.json(
        {
          success: false,
          error: '본인이 속한 조직의 코드만 생성할 수 있습니다'
        },
        { status: 403 }
      )
    }

    // 코드 생성 및 중복 확인 (최대 5회 재시도)
    let code: string
    let attempts = 0
    const maxAttempts = 5
    
    do {
      code = generateClassCode()
      attempts++
      
      // 중복 확인
      const { data: existingCode } = await supabase
        .from('org_codes')
        .select('id')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle()
      
      if (!existingCode) {
        break // 중복되지 않는 코드 발견
      }
      
      if (attempts >= maxAttempts) {
        return NextResponse.json(
          {
            success: false,
            error: '코드 생성에 실패했습니다. 다시 시도해주세요.'
          },
          { status: 500 }
        )
      }
    } while (attempts < maxAttempts)

    // 만료 시각 계산
    const expiresAt = calculateExpiresAt(ttlMinutes)

    // 데이터베이스에 코드 저장
    const { data: newCode, error: insertError } = await supabase
      .from('org_codes')
      .insert({
        code,
        org_id: orgId,
        created_by: userRecord.auth_id,
        expires_at: expiresAt.toISOString(),
        is_active: true
      })
      .select('code, expires_at, org_id')
      .single()

    if (insertError) {
      console.error('코드 생성 오류:', insertError)
      console.error('삽입 시도 데이터:', {
        code,
        org_id: orgId,
        created_by: userRecord.auth_id,
        expires_at: expiresAt.toISOString(),
        is_active: true
      })
      return NextResponse.json(
        {
          success: false,
          error: '코드 생성에 실패했습니다',
          details: process.env.NODE_ENV === 'development' ? insertError.message : undefined
        },
        { status: 500 }
      )
    }

    // 성공 응답
    const response = {
      success: true,
      data: {
        code: newCode.code,
        expiresAt: expiresAt.toISOString(),
        orgId: newCode.org_id,
        ttlMinutes
      }
    }

    return NextResponse.json(
      response,
      {
        status: 201,
        headers: {
          'X-RateLimit-Remaining': rateLimit.remaining.toString()
        }
      }
    )

  } catch (error) {
    console.error('generateCode API 오류:', error)
    console.error('오류 상세:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      error
    })
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다',
        details: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
      },
      { status: 500 }
    )
  }
}

// GET 메서드 지원 (현재 활성 코드 조회)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()

    // 사용자 인증 확인 (개발 모드에서는 우회)
    let user = null
    let authError = null
    
    if (process.env.NODE_ENV === 'development') {
      // 개발 모드에서는 임시 사용자 생성
      user = { id: 'dev-user-id' }
    } else {
      const authResult = await supabase.auth.getUser()
      user = authResult.data.user
      authError = authResult.error
    }
    
    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: '인증이 필요합니다'
        },
        { status: 401 }
      )
    }

    // 개발 모드에서는 임시 사용자 정보 사용
    let userRecord = null
    if (process.env.NODE_ENV === 'development') {
      userRecord = { auth_id: 'dev-user-id', org_id: '550e8400-e29b-41d4-a716-446655440001', role: 'teacher' }
    } else {
      // 사용자 정보 조회
      const { data, error: userError } = await supabase
        .from('users')
        .select('auth_id, org_id, role')
        .eq('auth_id', user.id)
        .single()

      if (userError || !data) {
        return NextResponse.json(
          {
            success: false,
            error: '사용자 정보를 찾을 수 없습니다'
          },
          { status: 404 }
        )
      }
      userRecord = data
    }

    // 권한 확인
    if (!['teacher', 'admin'].includes(userRecord.role)) {
      return NextResponse.json(
        {
          success: false,
          error: '교사 또는 관리자만 접근할 수 있습니다'
        },
        { status: 403 }
      )
    }

    // 현재 활성 코드 조회
    const { data: activeCodes, error: queryError } = await supabase
      .from('org_codes')
      .select('code, expires_at, created_at')
      .eq('org_id', userRecord.org_id)
      .eq('created_by', userRecord.auth_id)
      .eq('is_active', true)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (queryError) {
      console.error('코드 조회 오류:', queryError)
      return NextResponse.json(
        {
          success: false,
          error: '코드 조회에 실패했습니다'
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        activeCodes: activeCodes || []
      }
    })

  } catch (error) {
    console.error('generateCode GET API 오류:', error)
    return NextResponse.json(
      {
        success: false,
        error: '서버 오류가 발생했습니다'
      },
      { status: 500 }
    )
  }
}
