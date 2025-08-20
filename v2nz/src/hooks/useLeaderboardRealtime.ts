import { useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

interface UseLeaderboardRealtimeOptions {
  scope: 'global' | 'school'
  orgId?: string
  onUpdate?: () => void
  debounceMs?: number
}

export function useLeaderboardRealtime({
  scope,
  orgId,
  onUpdate,
  debounceMs = 1000
}: UseLeaderboardRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 디바운스된 업데이트 함수
  const debouncedUpdate = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    
    timeoutRef.current = setTimeout(() => {
      onUpdate?.()
    }, debounceMs)
  }, [onUpdate, debounceMs])

  // 리더보드 이벤트 구독
  const subscribeToLeaderboard = useCallback(() => {
    // 기존 구독 해제
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current)
      channelRef.current = null
    }

    // 새로운 구독 생성
    const channel = supabase
      .channel(`leaderboard-${scope}-${orgId || 'global'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'leaderboards',
          filter: scope === 'school' && orgId 
            ? `org_id=eq.${orgId}` 
            : undefined
        },
        (payload) => {
          console.log('Leaderboard update:', payload)
          debouncedUpdate()
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rounds'
        },
        (payload) => {
          console.log('Round update:', payload)
          debouncedUpdate()
        }
      )
      .subscribe((status) => {
        console.log('Leaderboard subscription status:', status)
      })

    channelRef.current = channel
  }, [scope, orgId, debouncedUpdate])

  // 구독 시작
  useEffect(() => {
    subscribeToLeaderboard()

    // 클린업 함수
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [subscribeToLeaderboard])

  // scope나 orgId가 변경되면 재구독
  useEffect(() => {
    subscribeToLeaderboard()
  }, [scope, orgId, subscribeToLeaderboard])

  return {
    isConnected: channelRef.current?.subscription?.state === 'SUBSCRIBED'
  }
}
