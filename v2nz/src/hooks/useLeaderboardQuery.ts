import { useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface LeaderboardEntry {
  rank: number
  user_id: string
  display_name: string
  username: string
  org_name: string | null
  total_score: number
  total_rounds: number
  best_score: number
  avg_score: number
  percentile: number
  stanine: number
  is_viewer: boolean
}

interface UseLeaderboardQueryOptions {
  scope: 'global' | 'school'
  orgId?: string
  limit?: number
  viewerUserId?: string
  enabled?: boolean
}

// 리더보드 데이터 페칭 함수
async function fetchLeaderboard({
  scope,
  orgId,
  limit = 100,
  viewerUserId
}: Omit<UseLeaderboardQueryOptions, 'enabled'>): Promise<LeaderboardEntry[]> {
  try {
    const { data, error } = await supabase.rpc('get_leaderboard', {
      scope_filter: scope,
      org_id_filter: orgId || null,
      limit_count: limit,
      viewer_user_id: viewerUserId || null
    })

    if (error) {
      console.warn('Leaderboard fetch error:', error)
      // 오류가 발생해도 빈 배열 반환 (우아한 실패)
      return []
    }

    return data || []
  } catch (error) {
    console.warn('Leaderboard fetch exception:', error)
    // 예외가 발생해도 빈 배열 반환 (우아한 실패)
    return []
  }
}

// 내 순위 조회 함수
async function fetchMyRank({
  scope,
  orgId,
  viewerUserId
}: {
  scope: 'global' | 'school'
  orgId?: string
  viewerUserId?: string
}): Promise<LeaderboardEntry | null> {
  if (!viewerUserId) return null

  try {
    const { data, error } = await supabase.rpc('get_leaderboard', {
      scope_filter: scope,
      org_id_filter: orgId || null,
      limit_count: 1,
      viewer_user_id: viewerUserId
    })

    if (error) {
      console.warn('My rank fetch error:', error)
      return null
    }

    // viewer가 포함된 결과에서 viewer 데이터만 반환
    const viewerEntry = data?.find(entry => entry.is_viewer)
    return viewerEntry || null
  } catch (error) {
    console.warn('My rank fetch exception:', error)
    return null
  }
}

// 리더보드 쿼리 훅
export function useLeaderboardQuery({
  scope,
  orgId,
  limit = 100,
  viewerUserId,
  enabled = true
}: UseLeaderboardQueryOptions) {
  return useQuery({
    queryKey: ['leaderboard', scope, orgId, limit, viewerUserId],
    queryFn: () => fetchLeaderboard({ scope, orgId, limit, viewerUserId }),
    enabled,
    staleTime: 30 * 1000, // 30초
    gcTime: 5 * 60 * 1000, // 5분
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  })
}

// 내 순위 쿼리 훅
export function useMyRankQuery({
  scope,
  orgId,
  viewerUserId,
  enabled = true
}: {
  scope: 'global' | 'school'
  orgId?: string
  viewerUserId?: string
  enabled?: boolean
}) {
  return useQuery({
    queryKey: ['myRank', scope, orgId, viewerUserId],
    queryFn: () => fetchMyRank({ scope, orgId, viewerUserId }),
    enabled: enabled && !!viewerUserId,
    staleTime: 30 * 1000, // 30초
    gcTime: 5 * 60 * 1000, // 5분
    refetchOnWindowFocus: false,
    refetchOnReconnect: true
  })
}

// 리더보드 무효화 훅
export function useInvalidateLeaderboard() {
  const queryClient = useQueryClient()

  return {
    invalidateLeaderboard: (scope?: 'global' | 'school', orgId?: string) => {
      queryClient.invalidateQueries({
        queryKey: ['leaderboard', scope, orgId]
      })
      queryClient.invalidateQueries({
        queryKey: ['myRank', scope, orgId]
      })
    },
    invalidateAllLeaderboards: () => {
      queryClient.invalidateQueries({
        queryKey: ['leaderboard']
      })
      queryClient.invalidateQueries({
        queryKey: ['myRank']
      })
    }
  }
}
