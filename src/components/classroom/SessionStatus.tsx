'use client'

import { useState } from 'react'
import { useOrgSession, useSessionExpiry } from '@/hooks/useOrgSession'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Clock, 
  Users, 
  LogOut, 
  AlertTriangle,
  CheckCircle,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SessionStatusProps {
  className?: string
  showDetails?: boolean
}

/**
 * 조직 세션 상태를 표시하는 컴포넌트
 */
export function SessionStatus({ className, showDetails = true }: SessionStatusProps) {
  const { 
    isActive, 
    session, 
    remainingMinutes,
    isLeaving,
    leaveError,
    leaveOrg 
  } = useOrgSession()
  
  const { showWarning, isExpiringSoon } = useSessionExpiry()
  const [isConfirmingLeave, setIsConfirmingLeave] = useState(false)

  if (!isActive || !session) {
    return null
  }

  const handleLeave = async () => {
    if (!isConfirmingLeave) {
      setIsConfirmingLeave(true)
      return
    }

    try {
      await leaveOrg()
      setIsConfirmingLeave(false)
    } catch (error) {
      console.error('교실 나가기 실패:', error)
      // 에러는 useOrgSession에서 처리됨
    }
  }

  const cancelLeave = () => {
    setIsConfirmingLeave(false)
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">교실 참여 중</CardTitle>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              참여중
            </Badge>
          </div>
          
          {!isConfirmingLeave ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLeave}
              disabled={isLeaving}
              className="text-gray-600 hover:text-red-600"
            >
              {isLeaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span className="ml-1">나가기</span>
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelLeave}
                disabled={isLeaving}
              >
                취소
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleLeave}
                disabled={isLeaving}
              >
                {isLeaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  '확인'
                )}
              </Button>
            </div>
          )}
        </div>
        
        {showDetails && (
          <CardDescription>
            <span className="font-medium">{session.orgName}</span>에 참여 중입니다
          </CardDescription>
        )}
      </CardHeader>

      {showDetails && (
        <CardContent className="space-y-4">
          {/* 남은 시간 */}
          <div className="flex items-center gap-2">
            <Clock className={cn(
              'h-4 w-4',
              isExpiringSoon ? 'text-orange-500' : 'text-blue-500'
            )} />
            <span className={cn(
              'text-sm',
              isExpiringSoon ? 'text-orange-700 font-medium' : 'text-gray-600'
            )}>
              남은 시간: {remainingMinutes}분
            </span>
          </div>

          {/* 광고 숨김 상태 */}
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm text-gray-600">광고 숨김 활성화</span>
          </div>

          {/* 만료 경고 */}
          {showWarning && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                교실 세션이 {remainingMinutes}분 후에 만료됩니다.
              </AlertDescription>
            </Alert>
          )}

          {/* 에러 메시지 */}
          {leaveError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                교실 나가기에 실패했습니다: {leaveError.message}
              </AlertDescription>
            </Alert>
          )}

          {/* 참여 정보 */}
          <div className="text-xs text-gray-500 pt-2 border-t">
            참여 시각: {new Date(session.joinedAt).toLocaleString('ko-KR')}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

/**
 * 간단한 세션 상태 표시기 (헤더 등에 사용)
 */
export function SessionIndicator({ className }: { className?: string }) {
  const { isActive, session, remainingMinutes } = useOrgSession()

  if (!isActive || !session) {
    return null
  }

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        <Users className="h-3 w-3 mr-1" />
        {session.orgName}
      </Badge>
      <span className="text-gray-500">
        {remainingMinutes}분 남음
      </span>
    </div>
  )
}
