/**
 * 퍼센타일 및 스테나인 계산 유틸리티
 * Supabase SQL 함수를 TypeScript에서 사용하기 위한 래퍼
 */

import { createClient } from '@supabase/supabase-js';
import { calculatePercentile, calculateStanine } from './round-metrics';

export interface PercentileStats {
  percentile: number;
  stanine: number;
  totalPlayers: number;
}

export interface UserPercentileStats {
  userId: string;
  score: number;
  percentile: number;
  stanine: number;
  rankPosition: number;
  totalPlayers: number;
}

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all_time';

/**
 * Supabase 클라이언트를 사용한 퍼센타일 계산
 */
export class PercentileCalculator {
  private supabase: ReturnType<typeof createClient>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * 점수에 대한 퍼센타일과 스테나인을 계산합니다.
   * @param score 점수
   * @param period 기간 (daily, weekly, monthly, all_time)
   * @param durationSec 라운드 시간 (선택사항)
   * @returns 퍼센타일 통계
   */
  async calculatePercentileStats(
    score: number,
    period: LeaderboardPeriod = 'daily',
    durationSec?: number
  ): Promise<PercentileStats> {
    try {
      const { data, error } = await this.supabase.rpc('get_percentile_and_stanine', {
        target_score: score,
        period_type: period,
        duration_sec: durationSec
      });

      if (error) {
        console.error('Supabase percentile calculation error:', error);
        return this.fallbackCalculation(score, period, durationSec);
      }

      if (data && data.length > 0) {
        const result = data[0];
        return {
          percentile: result.percentile || 0,
          stanine: result.stanine || 1,
          totalPlayers: result.total_players || 0
        };
      }

      return this.fallbackCalculation(score, period, durationSec);
    } catch (error) {
      console.error('Percentile calculation failed:', error);
      return this.fallbackCalculation(score, period, durationSec);
    }
  }

  /**
   * 사용자의 퍼센타일 통계를 조회합니다.
   * @param userId 사용자 ID
   * @param period 기간
   * @returns 사용자 퍼센타일 통계
   */
  async getUserPercentileStats(
    userId: string,
    period: LeaderboardPeriod = 'daily'
  ): Promise<UserPercentileStats | null> {
    try {
      const { data, error } = await this.supabase.rpc('get_user_percentile_stats', {
        user_id: userId,
        period_type: period
      });

      if (error) {
        console.error('Supabase user percentile stats error:', error);
        return null;
      }

      if (data && data.length > 0) {
        const result = data[0];
        return {
          userId: result.user_id,
          score: result.score || 0,
          percentile: result.percentile || 0,
          stanine: result.stanine || 1,
          rankPosition: result.rank_position || 0,
          totalPlayers: result.total_players || 0
        };
      }

      return null;
    } catch (error) {
      console.error('User percentile stats failed:', error);
      return null;
    }
  }

  /**
   * 폴백 계산: 클라이언트 사이드 계산
   * Supabase 함수가 실패할 경우 사용
   */
  private async fallbackCalculation(
    score: number,
    period: LeaderboardPeriod = 'daily',
    durationSec?: number
  ): Promise<PercentileStats> {
    try {
      // 리더보드에서 모든 점수를 가져와서 클라이언트에서 계산
      let query = this.supabase
        .from('leaderboards')
        .select('score')
        .eq('period', period);

      if (durationSec) {
        query = query.eq('duration_sec', durationSec);
      }

      // 기간별 필터링
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'daily':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'weekly':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'monthly':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'all_time':
          startDate = new Date(0);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }

      query = query.gte('created_at', startDate.toISOString());

      const { data, error } = await query;

      if (error || !data) {
        console.error('Fallback calculation failed:', error);
        return {
          percentile: 0,
          stanine: 1,
          totalPlayers: 0
        };
      }

      const scores = data.map(item => item.score).filter(s => s !== null);
      
      if (scores.length === 0) {
        return {
          percentile: 0,
          stanine: 1,
          totalPlayers: 0
        };
      }

      const percentile = calculatePercentile(score, scores);
      const stanine = calculateStanine(percentile);

      return {
        percentile,
        stanine,
        totalPlayers: scores.length
      };
    } catch (error) {
      console.error('Fallback calculation error:', error);
      return {
        percentile: 0,
        stanine: 1,
        totalPlayers: 0
      };
    }
  }

  /**
   * 여러 점수에 대한 퍼센타일을 일괄 계산합니다.
   * @param scores 점수 배열
   * @param period 기간
   * @param durationSec 라운드 시간
   * @returns 퍼센타일 통계 배열
   */
  async calculateBatchPercentiles(
    scores: number[],
    period: LeaderboardPeriod = 'daily',
    durationSec?: number
  ): Promise<PercentileStats[]> {
    const results: PercentileStats[] = [];

    for (const score of scores) {
      const stats = await this.calculatePercentileStats(score, period, durationSec);
      results.push(stats);
    }

    return results;
  }

  /**
   * 퍼센타일 등급을 텍스트로 변환합니다.
   * @param percentile 퍼센타일
   * @returns 등급 텍스트
   */
  static getPercentileGrade(percentile: number): string {
    if (percentile >= 95) return '상위 5%';
    if (percentile >= 90) return '상위 10%';
    if (percentile >= 80) return '상위 20%';
    if (percentile >= 70) return '상위 30%';
    if (percentile >= 60) return '상위 40%';
    if (percentile >= 50) return '상위 50%';
    if (percentile >= 40) return '상위 60%';
    if (percentile >= 30) return '상위 70%';
    if (percentile >= 20) return '상위 80%';
    if (percentile >= 10) return '상위 90%';
    return '상위 100%';
  }

  /**
   * 스테나인을 텍스트로 변환합니다.
   * @param stanine 스테나인
   * @returns 등급 텍스트
   */
  static getStanineGrade(stanine: number): string {
    switch (stanine) {
      case 9: return '매우 우수';
      case 8: return '우수';
      case 7: return '양호';
      case 6: return '보통';
      case 5: return '평균';
      case 4: return '보통';
      case 3: return '미흡';
      case 2: return '부족';
      case 1: return '매우 부족';
      default: return '평가 불가';
    }
  }
}
