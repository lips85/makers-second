/**
 * 리더보드 업데이트 유틸리티
 * 최고 점수 정책을 기준으로 리더보드를 갱신합니다.
 */

import { createClient } from '@supabase/supabase-js'

// 환경변수 검증
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://test.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'test-key'

const supabase = createClient(supabaseUrl, supabaseKey)

export interface LeaderboardEntry {
  user_id: string
  period: 'daily' | 'weekly' | 'monthly' | 'all_time'
  duration_sec: number
  score: number
  accuracy: number
  speed: number
  grade: string
  percentile: number
  stanine: number
  updated_at?: string
}

export interface UpsertLeaderboardOptions {
  userId: string
  period: 'daily' | 'weekly' | 'monthly' | 'all_time'
  durationSec: number
  score: number
  accuracy: number
  speed: number
  grade: string
  percentile: number
  stanine: number
}

/**
 * 리더보드 엔트리를 업데이트합니다.
 * 최고 점수 정책을 기준으로 갱신합니다.
 */
export async function upsertLeaderboard(options: UpsertLeaderboardOptions): Promise<{
  success: boolean
  updated: boolean
  error?: string
}> {
  try {
    const { userId, period, durationSec, score, accuracy, speed, grade, percentile, stanine } = options

    // 기존 리더보드 엔트리 조회
    const { data: existingEntry, error: fetchError } = await supabase
      .from('leaderboards')
      .select('*')
      .eq('user_id', userId)
      .eq('period', period)
      .eq('duration_sec', durationSec)
      .eq('scope', 'global')
      .eq('subject', 'vocabulary')
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116는 "not found" 에러
      console.error('Error fetching existing leaderboard entry:', fetchError)
      return { success: false, error: 'Failed to fetch existing entry' }
    }

    let shouldUpdate = false
    let updated = false

    if (!existingEntry) {
      // 새로운 엔트리 생성
      shouldUpdate = true
    } else {
      // 최고 점수 정책: 현재 점수가 기존 점수보다 높으면 업데이트
      if (score > existingEntry.score) {
        shouldUpdate = true
      } else if (score === existingEntry.score) {
        // 점수가 같으면 정확도가 높은 것을 우선
        if (accuracy > existingEntry.accuracy) {
          shouldUpdate = true
        } else if (accuracy === existingEntry.accuracy) {
          // 정확도도 같으면 속도가 빠른 것을 우선
          if (speed < existingEntry.speed) {
            shouldUpdate = true
          }
        }
      }
    }

    if (shouldUpdate) {
      const { error: upsertError } = await supabase
        .from('leaderboards')
        .upsert({
          user_id: userId,
          period,
          duration_sec: durationSec,
          scope: 'global',
          subject: 'vocabulary',
          score,
          accuracy,
          speed,
          grade,
          percentile,
          stanine,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,period,duration_sec,scope,subject'
        })

      if (upsertError) {
        console.error('Error upserting leaderboard entry:', upsertError)
        return { success: false, error: 'Failed to update leaderboard' }
      }

      updated = true
    }

    return { success: true, updated }
  } catch (error) {
    console.error('Unexpected error in upsertLeaderboard:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

/**
 * 사용자의 리더보드 순위를 조회합니다.
 */
export async function getUserLeaderboardRank(options: {
  userId: string
  period: 'daily' | 'weekly' | 'monthly' | 'all_time'
  durationSec: number
}): Promise<{
  success: boolean
  rank?: number
  totalPlayers?: number
  error?: string
}> {
  try {
    const { userId, period, durationSec } = options

    // 해당 기간과 지속시간의 모든 플레이어 수 조회
    const { count: totalPlayers, error: countError } = await supabase
      .from('leaderboards')
      .select('*', { count: 'exact', head: true })
      .eq('period', period)
      .eq('duration_sec', durationSec)
      .eq('scope', 'global')
      .eq('subject', 'vocabulary')

    if (countError) {
      console.error('Error counting total players:', countError)
      return { success: false, error: 'Failed to count total players' }
    }

    // 사용자의 점수 조회
    const { data: userEntry, error: userError } = await supabase
      .from('leaderboards')
      .select('score')
      .eq('user_id', userId)
      .eq('period', period)
      .eq('duration_sec', durationSec)
      .eq('scope', 'global')
      .eq('subject', 'vocabulary')
      .single()

    if (userError) {
      if (userError.code === 'PGRST116') {
        // 사용자가 리더보드에 없는 경우
        return { success: true, rank: 0, totalPlayers: totalPlayers || 0 }
      }
      console.error('Error fetching user entry:', userError)
      return { success: false, error: 'Failed to fetch user entry' }
    }

    // 사용자보다 높은 점수를 가진 플레이어 수 조회
    const { count: higherScores, error: rankError } = await supabase
      .from('leaderboards')
      .select('*', { count: 'exact', head: true })
      .eq('period', period)
      .eq('duration_sec', durationSec)
      .eq('scope', 'global')
      .eq('subject', 'vocabulary')
      .gt('score', userEntry.score)

    if (rankError) {
      console.error('Error calculating rank:', rankError)
      return { success: false, error: 'Failed to calculate rank' }
    }

    const rank = (higherScores || 0) + 1

    return { 
      success: true, 
      rank, 
      totalPlayers: totalPlayers || 0 
    }
  } catch (error) {
    console.error('Unexpected error in getUserLeaderboardRank:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

/**
 * 리더보드 상위 플레이어를 조회합니다.
 */
export async function getTopLeaderboard(options: {
  period: 'daily' | 'weekly' | 'monthly' | 'all_time'
  durationSec: number
  limit?: number
}): Promise<{
  success: boolean
  entries?: Array<{
    user_id: string
    score: number
    accuracy: number
    speed: number
    grade: string
    percentile: number
    stanine: number
    rank: number
  }>
  error?: string
}> {
  try {
    const { period, durationSec, limit = 10 } = options

    const { data: entries, error } = await supabase
      .from('leaderboards')
      .select('user_id, score, accuracy, speed, grade, percentile, stanine')
      .eq('period', period)
      .eq('duration_sec', durationSec)
      .eq('scope', 'global')
      .eq('subject', 'vocabulary')
      .order('score', { ascending: false })
      .order('accuracy', { ascending: false })
      .order('speed', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching top leaderboard:', error)
      return { success: false, error: 'Failed to fetch leaderboard' }
    }

    const rankedEntries = entries?.map((entry, index) => ({
      ...entry,
      rank: index + 1
    })) || []

    return { success: true, entries: rankedEntries }
  } catch (error) {
    console.error('Unexpected error in getTopLeaderboard:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

/**
 * 리더보드 통계를 조회합니다.
 */
export async function getLeaderboardStats(options: {
  period: 'daily' | 'weekly' | 'monthly' | 'all_time'
  durationSec: number
}): Promise<{
  success: boolean
  stats?: {
    totalPlayers: number
    averageScore: number
    topScore: number
    medianScore: number
  }
  error?: string
}> {
  try {
    const { period, durationSec } = options

    // 기본 통계 조회
    const { data: entries, error } = await supabase
      .from('leaderboards')
      .select('score')
      .eq('period', period)
      .eq('duration_sec', durationSec)
      .eq('scope', 'global')
      .eq('subject', 'vocabulary')
      .order('score', { ascending: false })

    if (error) {
      console.error('Error fetching leaderboard stats:', error)
      return { success: false, error: 'Failed to fetch leaderboard stats' }
    }

    if (!entries || entries.length === 0) {
      return { 
        success: true, 
        stats: { 
          totalPlayers: 0, 
          averageScore: 0, 
          topScore: 0, 
          medianScore: 0 
        } 
      }
    }

    const scores = entries.map(entry => entry.score)
    const totalPlayers = scores.length
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalPlayers
    const topScore = Math.max(...scores)
    
    // 중앙값 계산
    const sortedScores = [...scores].sort((a, b) => a - b)
    const medianScore = totalPlayers % 2 === 0
      ? (sortedScores[totalPlayers / 2 - 1] + sortedScores[totalPlayers / 2]) / 2
      : sortedScores[Math.floor(totalPlayers / 2)]

    return {
      success: true,
      stats: {
        totalPlayers,
        averageScore: Math.round(averageScore),
        topScore,
        medianScore: Math.round(medianScore)
      }
    }
  } catch (error) {
    console.error('Unexpected error in getLeaderboardStats:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}
