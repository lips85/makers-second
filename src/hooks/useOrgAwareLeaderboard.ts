import { useQuery } from '@tanstack/react-query'
import { useOrgSession } from './useOrgSession'
import { 
  useLeaderboardQuery, 
  useMyRankQuery,
  type LeaderboardEntry 
} from './useLeaderboardQuery'
import { 
  getOrgFilterFromSession, 
  generateOrgCacheKey 
} from '@/lib/classroom/org-filter'

interface UseOrgAwareLeaderboardOptions {
  limit?: number
  enabled?: boolean
  userPreference?: {
    scope: 'global' | 'school'
    orgId?: string
  }
}

/**
 * 조직 세션을 고려한 리더보드 쿼리 훅
 * - 세션이 활성화된 경우 해당 조직 범위로 자동 필터링
 * - 세션이 없는 경우 사용자 선택 또는 글로벌 범위 사용
 */
export function useOrgAwareLeaderboard({
  limit = 50,
  enabled = true,
  userPreference
}: UseOrgAwareLeaderboardOptions = {}) {
  const { session, isActive } = useOrgSession()

  // 세션 상태에 따른 필터 설정
  const filterConfig = getOrgFilterFromSession(session, userPreference)

  // 기존 리더보드 쿼리 재사용
  const leaderboardQuery = useLeaderboardQuery({
    scope: filterConfig.scope,
    orgId: filterConfig.orgId,
    limit,
    enabled,
    // 세션 기반인 경우 다른 캐시 키 사용
    queryKey: generateOrgCacheKey(['leaderboard'], session)
  })

  // 내 순위 쿼리도 동일한 설정 적용
  const myRankQuery = useMyRankQuery({
    scope: filterConfig.scope,
    orgId: filterConfig.orgId,
    enabled,
    queryKey: generateOrgCacheKey(['myRank'], session)
  })

  return {
    // 리더보드 데이터
    data: leaderboardQuery.data,
    isLoading: leaderboardQuery.isLoading,
    error: leaderboardQuery.error,
    refetch: leaderboardQuery.refetch,

    // 내 순위 데이터
    myRank: myRankQuery.data,
    isMyRankLoading: myRankQuery.isLoading,
    myRankError: myRankQuery.error,

    // 필터 상태
    filterConfig,
    isSessionBased: filterConfig.sessionBased,
    activeSession: session,

    // 세션 상태
    isSessionActive: isActive,
    orgName: session?.orgName,
    remainingMinutes: session ? 
      Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / (60 * 1000))) : 
      0
  }
}

/**
 * 조직 세션 고려 없이 특정 스코프의 리더보드를 가져오는 훅
 * (기존 동작 유지용)
 */
export function useManualLeaderboard({
  scope,
  orgId,
  limit = 50,
  viewerUserId,
  enabled = true
}: {
  scope: 'global' | 'school'
  orgId?: string
  limit?: number
  viewerUserId?: string
  enabled?: boolean
}) {
  return useLeaderboardQuery({
    scope,
    orgId,
    limit,
    viewerUserId,
    enabled
  })
}

/**
 * 세션이 활성화된 경우에만 조직 리더보드를 가져오는 훅
 */
export function useSessionOnlyLeaderboard({
  limit = 50,
  enabled = true
}: {
  limit?: number
  enabled?: boolean
} = {}) {
  const { session, isActive } = useOrgSession()

  return useLeaderboardQuery({
    scope: 'school',
    orgId: session?.orgId,
    limit,
    enabled: enabled && isActive && !!session,
    queryKey: generateOrgCacheKey(['sessionLeaderboard'], session)
  })
}

/**
 * 조직 세션이 변경될 때 리더보드 캐시를 무효화하는 훅
 */
export function useLeaderboardSessionSync() {
  const { session } = useOrgSession()
  
  // 세션 변경 시 자동으로 쿼리가 재실행되므로 별도 처리 불필요
  // React Query의 queryKey 변경으로 자동 처리됨
  
  return {
    currentSession: session,
    cacheKey: generateOrgCacheKey(['leaderboard'], session)
  }
}
