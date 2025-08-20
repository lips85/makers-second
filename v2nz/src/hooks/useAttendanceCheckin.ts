import { useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase'

export interface AttendanceCheckinData {
  isNew: boolean
  attendDate: string
  streakBefore: number
  streakAfter: number
  rewardPoints: number
  totalPoints: number
}

export interface AttendanceStats {
  user_id: string
  total_attendance_days: number
  max_streak: number
  total_reward_points: number
  last_attendance_date: string | null
}

export interface UseAttendanceCheckinReturn {
  checkin: (attendDate?: string) => Promise<AttendanceCheckinData | null>
  getStats: () => Promise<AttendanceStats | null>
  isLoading: boolean
  error: string | null
  lastCheckinDate: string | null
}

export function useAttendanceCheckin(): UseAttendanceCheckinReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastCheckinDate, setLastCheckinDate] = useState<string | null>(null)
  const checkinInProgress = useRef(false)

  const checkin = useCallback(async (attendDate?: string): Promise<AttendanceCheckinData | null> => {
    // 중복 호출 방지
    if (checkinInProgress.current) {
      console.log('출석 체크가 이미 진행 중입니다.')
      return null
    }

    // 오늘 이미 체크인했는지 확인 (클라이언트 측 보호)
    const today = new Date()
    const kstOffset = 9 * 60 // KST는 UTC+9
    const kstTime = new Date(today.getTime() + kstOffset * 60 * 1000)
    const todayString = kstTime.toISOString().split('T')[0]

    if (lastCheckinDate === todayString) {
      console.log('오늘 이미 출석 체크를 완료했습니다.')
      return null
    }

    checkinInProgress.current = true
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      
      // API 호출
      const response = await fetch('/api/attendance/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          attendDate: attendDate || todayString
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '출석 체크에 실패했습니다')
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        // 성공 시 마지막 체크인 날짜 업데이트
        setLastCheckinDate(result.data.attendDate)
        return result.data
      } else {
        throw new Error(result.error || '출석 체크 응답이 올바르지 않습니다')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '출석 체크 중 오류가 발생했습니다'
      setError(errorMessage)
      console.error('출석 체크 오류:', err)
      return null
    } finally {
      setIsLoading(false)
      checkinInProgress.current = false
    }
  }, [lastCheckinDate])

  const getStats = useCallback(async (): Promise<AttendanceStats | null> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/attendance/checkin', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || '출석 통계 조회에 실패했습니다')
      }

      const result = await response.json()
      
      if (result.success && result.data) {
        return result.data
      } else {
        throw new Error(result.error || '출석 통계 응답이 올바르지 않습니다')
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '출석 통계 조회 중 오류가 발생했습니다'
      setError(errorMessage)
      console.error('출석 통계 조회 오류:', err)
      return null
    } finally {
      setIsLoading(false)
    }
  }, [])

  return {
    checkin,
    getStats,
    isLoading,
    error,
    lastCheckinDate
  }
}
