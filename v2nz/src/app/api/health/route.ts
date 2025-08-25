import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * Health Check API for Production Monitoring
 * 프로덕션 배포 후 시스템 상태를 확인하는 헬스체크 엔드포인트
 */
export async function GET() {
  const startTime = Date.now()
  
  try {
    // 1. 환경 변수 확인
    if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      return NextResponse.json({
        status: 'error',
        message: 'Missing required environment variables',
        timestamp: new Date().toISOString(),
        checks: {
          env: false,
          database: false,
          api: false
        }
      }, { status: 500 })
    }

    // 2. Supabase 연결 테스트
    const supabase = createClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    // 3. 기본 테이블 접근 테스트 (public 테이블)
    const { data: wordData, error: wordError } = await supabase
      .from('word_items')
      .select('id')
      .limit(1)

    if (wordError) {
      return NextResponse.json({
        status: 'error',
        message: 'Database connection failed',
        error: wordError.message,
        timestamp: new Date().toISOString(),
        responseTime: Date.now() - startTime,
        checks: {
          env: true,
          database: false,
          api: true
        }
      }, { status: 500 })
    }

    // 4. 테이블 목록 확인 (RPC 함수 사용)
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_list')

    if (tablesError) {
      console.warn('Table list check failed:', tablesError.message)
    }

    const responseTime = Date.now() - startTime

    // 5. 성공 응답
    return NextResponse.json({
      status: 'healthy',
      message: 'All systems operational',
      timestamp: new Date().toISOString(),
      responseTime,
      version: process.env.npm_package_version || '1.0.0',
      environment: env.NODE_ENV,
      checks: {
        env: true,
        database: true,
        api: true,
        tables: tables ? tables.length : 0
      },
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
      }
    })

  } catch (error) {
    const responseTime = Date.now() - startTime
    
    console.error('Health check failed:', error)
    
    return NextResponse.json({
      status: 'error',
      message: 'Health check failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      responseTime,
      checks: {
        env: true,
        database: false,
        api: false
      }
    }, { status: 500 })
  }
}

// CORS 지원 (모니터링 도구에서 접근 가능하도록)
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
