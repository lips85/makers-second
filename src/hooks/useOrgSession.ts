import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

// 세션 데이터 타입
export interface OrgSession {
  orgId: string
  orgName: string
  expiresAt: string
  adsHidden: boolean
  joinedAt: string
}

// 세션 상태 타입
export interface OrgSessionState {
  isActive: boolean
  session: OrgSession | null
  expired?: boolean
}

// API 호출 함수들
async function fetchSessionStatus(): Promise<OrgSessionState> {
  const response = await fetch('/api/joinCode', {
    method: 'GET',
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error('세션 상태 조회 실패')
  }
  
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || '세션 상태 조회 실패')
  }
  
  return result.data
}

async function joinOrganization(code: string): Promise<OrgSession> {
  const response = await fetch('/api/joinCode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ code })
  })
  
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || '교실 참여 실패')
  }
  
  return result.data
}

async function leaveOrganization(): Promise<void> {
  const response = await fetch('/api/joinCode', {
    method: 'DELETE',
    credentials: 'include'
  })
  
  if (!response.ok) {
    throw new Error('교실 나가기 실패')
  }
  
  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || '교실 나가기 실패')
  }
}

// React Query 키
const ORG_SESSION_KEY = ['orgSession']

/**
 * 조직 세션 상태를 관리하는 훅
 */
export function useOrgSession() {
  const queryClient = useQueryClient()
  
  // 세션 상태 조회
  const {
    data: sessionState,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ORG_SESSION_KEY,
    queryFn: fetchSessionStatus,
    staleTime: 30 * 1000, // 30초
    refetchInterval: 60 * 1000, // 1분마다 자동 갱신
    refetchIntervalInBackground: false,
    retry: (failureCount, error) => {
      // 네트워크 오류가 아닌 경우 재시도하지 않음
      return failureCount < 2 && !error.message.includes('세션')
    }
  })

  // 조직 참여 뮤테이션
  const joinMutation = useMutation({
    mutationFn: joinOrganization,
    onSuccess: (data) => {
      // 성공 시 세션 상태 업데이트
      queryClient.setQueryData(ORG_SESSION_KEY, {
        isActive: true,
        session: data
      })
    },
    onError: (error) => {
      console.error('조직 참여 실패:', error)
    }
  })

  // 조직 나가기 뮤테이션
  const leaveMutation = useMutation({
    mutationFn: leaveOrganization,
    onSuccess: () => {
      // 성공 시 세션 상태 초기화
      queryClient.setQueryData(ORG_SESSION_KEY, {
        isActive: false,
        session: null
      })
    },
    onError: (error) => {
      console.error('조직 나가기 실패:', error)
    }
  })

  // 편의 함수들
  const joinOrg = useCallback((code: string) => {
    return joinMutation.mutateAsync(code)
  }, [joinMutation])

  const leaveOrg = useCallback(() => {
    return leaveMutation.mutateAsync()
  }, [leaveMutation])

  const refreshSession = useCallback(() => {
    return refetch()
  }, [refetch])

  // 현재 상태 계산
  const isActive = sessionState?.isActive ?? false
  const session = sessionState?.session ?? null
  const isExpired = sessionState?.expired ?? false
  const adsHidden = session?.adsHidden ?? false

  // 남은 시간 계산
  const remainingMinutes = session?.expiresAt ? 
    Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / (60 * 1000))) : 
    0

  return {
    // 상태
    isActive,
    session,
    isExpired,
    adsHidden,
    remainingMinutes,
    
    // 로딩 상태
    isLoading,
    error,
    
    // 액션 상태
    isJoining: joinMutation.isPending,
    isLeaving: leaveMutation.isPending,
    joinError: joinMutation.error,
    leaveError: leaveMutation.error,
    
    // 액션 함수
    joinOrg,
    leaveOrg,
    refreshSession
  }
}

/**
 * 광고 표시 여부를 결정하는 훅
 */
export function useAdsVisibility() {
  const { adsHidden, isActive } = useOrgSession()
  
  // 세션이 활성화되어 있고 adsHidden이 true인 경우 광고 숨김
  const shouldHideAds = isActive && adsHidden
  
  return {
    shouldHideAds,
    shouldShowAds: !shouldHideAds
  }
}

/**
 * 세션 만료 알림을 위한 훅
 */
export function useSessionExpiry() {
  const { session, isActive, remainingMinutes } = useOrgSession()
  const [showWarning, setShowWarning] = useState(false)
  
  useEffect(() => {
    if (!isActive || !session) {
      setShowWarning(false)
      return
    }
    
    // 5분 이하 남은 경우 경고 표시
    if (remainingMinutes <= 5 && remainingMinutes > 0) {
      setShowWarning(true)
    } else {
      setShowWarning(false)
    }
  }, [isActive, session, remainingMinutes])
  
  return {
    showWarning,
    remainingMinutes,
    isExpiringSoon: remainingMinutes <= 5 && remainingMinutes > 0
  }
}
