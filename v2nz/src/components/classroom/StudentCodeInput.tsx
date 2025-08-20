'use client'

import { useState } from 'react'
import { useOrgSession } from '@/hooks/useOrgSession'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Users, 
  LogIn, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  Clock,
  Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { validateCodeFormat } from '@/lib/classroom/code-utils'

interface StudentCodeInputProps {
  className?: string
  onJoinSuccess?: (orgName: string) => void
}

export function StudentCodeInput({ 
  className, 
  onJoinSuccess 
}: StudentCodeInputProps) {
  const [code, setCode] = useState('')
  const [validationError, setValidationError] = useState<string>()
  
  const {
    isActive,
    session,
    isJoining,
    joinError,
    joinOrg
  } = useOrgSession()

  const handleCodeChange = (value: string) => {
    // 자동으로 대문자 변환 및 공백 제거
    const cleanCode = value.toUpperCase().replace(/\s/g, '')
    setCode(cleanCode)
    
    // 실시간 형식 검증
    if (cleanCode && cleanCode.length === 6) {
      const validation = validateCodeFormat(cleanCode)
      setValidationError(validation.isValid ? undefined : validation.error)
    } else if (cleanCode && cleanCode.length > 0) {
      setValidationError(cleanCode.length !== 6 ? '6자리 코드를 입력해주세요' : undefined)
    } else {
      setValidationError(undefined)
    }
  }

  const handleJoin = async () => {
    if (!code) {
      setValidationError('코드를 입력해주세요')
      return
    }

    const validation = validateCodeFormat(code)
    if (!validation.isValid) {
      setValidationError(validation.error)
      return
    }

    try {
      await joinOrg(code)
      
      // 성공 시 콜백 호출
      if (onJoinSuccess && session) {
        onJoinSuccess(session.orgName)
      }
      
      // 입력 필드 초기화
      setCode('')
      setValidationError(undefined)
    } catch (error) {
      // 에러는 useOrgSession에서 처리됨
      console.error('교실 참여 실패:', error)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleJoin()
    }
  }

  // 이미 교실에 참여 중인 경우
  if (isActive && session) {
    return (
      <Card className={cn('w-full max-w-md', className)}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            교실 참여 완료
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center space-y-2">
            <div className="text-lg font-semibold">{session.orgName}</div>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>
                {Math.max(0, Math.floor((new Date(session.expiresAt).getTime() - Date.now()) / (60 * 1000)))}분 남음
              </span>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-green-800 dark:text-green-200">
              <Shield className="h-4 w-4" />
              <span>광고 없는 학습 환경이 활성화되었습니다</span>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn('w-full max-w-md', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          교실 참여
        </CardTitle>
        <CardDescription>
          선생님이 제공한 6자리 코드를 입력하세요
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="classroom-code">교실 코드</Label>
          <Input
            id="classroom-code"
            type="text"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="ABC123"
            maxLength={6}
            className={cn(
              'text-center text-2xl font-mono tracking-widest',
              validationError && 'border-red-500'
            )}
            disabled={isJoining}
          />
          <div className="text-xs text-gray-500 text-center">
            대문자와 숫자 6자리
          </div>
        </div>

        {validationError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{validationError}</AlertDescription>
          </Alert>
        )}

        {joinError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {joinError.message}
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleJoin}
          disabled={isJoining || !code || !!validationError}
          className="w-full"
          size="lg"
        >
          {isJoining ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <LogIn className="h-4 w-4 mr-2" />
          )}
          교실 참여하기
        </Button>

        {/* 안내사항 */}
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p className="text-center font-medium">참여 혜택:</p>
          <ul className="text-xs space-y-1">
            <li>• 광고 없는 쾌적한 학습 환경</li>
            <li>• 학교별 리더보드 참여</li>
            <li>• 실시간 순위 확인</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
