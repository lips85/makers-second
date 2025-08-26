/**
 * 라운드 제출 API Route Handler
 * POST /api/submitRound
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { validateSubmitRoundRequest, type SubmitRoundRequest, type SubmitRoundResponse } from '@/lib/game/submit-round-schema';
import { validateRoundSubmission, ValidationErrorCode } from '@/lib/game/round-validation';
import { computeRoundMetrics } from '@/lib/game/round-metrics';
import { PercentileCalculator } from '@/lib/game/percentile-utils';
import { upsertLeaderboard, getUserLeaderboardRank } from '@/lib/game/leaderboard-utils';

// 환경변수 검증 (테스트 환경에서는 모킹된 값 사용)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// 멱등성을 위한 캐시 (실제 운영에서는 Redis 사용 권장)
const submittedRounds = new Set<string>();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. 요청 데이터 파싱 및 검증
    const body = await request.json();
    
    let validatedRequest: SubmitRoundRequest;
    try {
      validatedRequest = validateSubmitRoundRequest(body);
    } catch (error) {
      return NextResponse.json({
        success: false,
        message: 'Invalid request data',
        errors: [{ code: 'VALIDATION_ERROR', message: 'Request validation failed' }]
      }, { status: 400 });
    }

    // 2. 멱등성 검사 (roundId가 제공된 경우만)
    const roundId = validatedRequest.roundId;
    if (roundId && submittedRounds.has(roundId)) {
      // 이미 제출된 라운드인 경우 기존 결과 반환
      return NextResponse.json({
        success: true,
        message: 'Round already submitted',
        roundId,
        metrics: {
          accuracy: 0,
          speed: 0,
          normalizedSpeed: 0,
          totalScore: 0,
          maxPossibleScore: 0,
          grade: 'F'
        }
      });
    }

    // 3. 서버 사이드 검증
    const validationResult = validateRoundSubmission({
      durationSec: validatedRequest.durationSec,
      totalQuestions: validatedRequest.totalQuestions,
      correctAnswers: validatedRequest.correctAnswers,
      items: validatedRequest.items,
      startTime: validatedRequest.startTime,
      endTime: validatedRequest.endTime,
      clientCalculatedScore: validatedRequest.clientCalculatedScore
    });

    if (!validationResult.isValid) {
      return NextResponse.json({
        success: false,
        message: 'Round validation failed',
        errors: validationResult.errors
      }, { status: 400 });
    }

    // 4. 사용자 인증 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        message: 'Authentication required',
        errors: [{ code: 'AUTH_REQUIRED', message: 'User must be authenticated' }]
      }, { status: 401 });
    }
    
    const userId = user.id;

    // 5. 서버 메트릭 계산
    const serverMetrics = validationResult.serverMetrics!;
    
    // 6. 퍼센타일 계산
    const percentileCalculator = new PercentileCalculator(supabaseUrl, supabaseKey);
    const percentileStats = await percentileCalculator.calculatePercentileStats(
      serverMetrics.totalScore,
      'daily',
      validatedRequest.durationSec
    );

    // 7. 데이터베이스에 라운드 저장
    const { data: roundData, error: roundError } = await supabase
      .from('rounds')
      .insert({
        id: roundId,
        user_id: userId,
        duration_sec: validatedRequest.durationSec,
        total_questions: validatedRequest.totalQuestions,
        correct_answers: validatedRequest.correctAnswers,
        score: serverMetrics.totalScore,
        accuracy: serverMetrics.accuracy,
        speed: serverMetrics.speed,
        normalized_speed: serverMetrics.normalizedSpeed,
        grade: serverMetrics.grade,
        start_time: validatedRequest.startTime,
        end_time: validatedRequest.endTime
      })
      .select()
      .single();

    if (roundError) {
      console.error('Round insertion error:', roundError);
      return NextResponse.json({
        success: false,
        message: 'Failed to save round data',
        errors: [{ code: 'DB_ERROR', message: 'Database operation failed' }]
      }, { status: 500 });
    }

    // 8. 라운드 아이템 저장
    const roundItems = validatedRequest.items.map((item, index) => ({
      round_id: roundId,
      question_index: index,
      is_correct: item.isCorrect,
      response_time_ms: item.responseTimeMs,
      score: item.score
    }));

    const { error: itemsError } = await supabase
      .from('round_items')
      .insert(roundItems);

    if (itemsError) {
      console.error('Round items insertion error:', itemsError);
      // 라운드는 저장되었지만 아이템 저장 실패 - 부분적 성공으로 처리
    }

    // 9. 리더보드 업데이트
    const leaderboardResult = await upsertLeaderboard({
      userId: userId,
      period: 'daily',
      durationSec: validatedRequest.durationSec,
      score: serverMetrics.totalScore,
      accuracy: serverMetrics.accuracy,
      speed: serverMetrics.speed,
      grade: serverMetrics.grade,
      percentile: percentileStats.percentile,
      stanine: percentileStats.stanine
    });

    if (!leaderboardResult.success) {
      console.error('Leaderboard update error:', leaderboardResult.error);
      // 리더보드 업데이트 실패는 치명적이지 않음
    }

    // 10. 사용자 순위 조회
    const rankResult = await getUserLeaderboardRank({
      userId: userId,
      period: 'daily',
      durationSec: validatedRequest.durationSec
    });

    const userRank = rankResult.success ? rankResult.rank || 0 : 0;
    const totalPlayers = rankResult.success ? rankResult.totalPlayers || 0 : 0;

    // 10. 멱등성 캐시에 추가 (roundId가 있는 경우만)
    if (roundId) {
      submittedRounds.add(roundId);
    }

    // 11. 성공 응답

    const response: SubmitRoundResponse = {
      success: true,
      roundId: roundData?.id || roundId,
      metrics: {
        accuracy: serverMetrics.accuracy,
        speed: serverMetrics.speed,
        normalizedSpeed: serverMetrics.normalizedSpeed,
        totalScore: serverMetrics.totalScore,
        maxPossibleScore: serverMetrics.maxPossibleScore,
        grade: serverMetrics.grade,
        percentile: percentileStats.percentile,
        stanine: percentileStats.stanine
      },
      percentileStats: {
        percentile: percentileStats.percentile,
        stanine: percentileStats.stanine,
        totalPlayers: percentileStats.totalPlayers
      },
      leaderboard: {
        rank: userRank,
        totalPlayers: totalPlayers,
        period: 'daily'
      },
      message: 'Round submitted successfully'
    };

    return NextResponse.json(response, { status: 200 });

  } catch (error) {
    console.error('Submit round error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      errors: [{ code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }]
    }, { status: 500 });
  }
}

// OPTIONS 요청 처리 (CORS)
export async function OPTIONS(request: NextRequest): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
