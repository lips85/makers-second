'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Copy, 
  QrCode, 
  Clock, 
  Users, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { validateTTL } from '@/lib/classroom/code-utils'

interface GeneratedCode {
  code: string
  expiresAt: string
  orgId: string
  ttlMinutes: number
}

interface ActiveCode {
  code: string
  expires_at: string
  created_at: string
}

// API 호출 함수들
async function generateCode(data: { ttlMinutes: number; orgId: string }): Promise<GeneratedCode> {
  const response = await fetch('/api/generateCode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(data)
  })

  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || '코드 생성에 실패했습니다')
  }

  return result.data
}

async function fetchActiveCodes(): Promise<{ activeCodes: ActiveCode[] }> {
  const response = await fetch('/api/generateCode', {
    method: 'GET',
    credentials: 'include'
  })

  const result = await response.json()
  if (!result.success) {
    throw new Error(result.error || '활성 코드 조회에 실패했습니다')
  }

  return result.data
}

interface TeacherCodeGeneratorProps {
  orgId: string
  orgName: string
  className?: string
}

export function TeacherCodeGenerator({ 
  orgId, 
  orgName, 
  className 
}: TeacherCodeGeneratorProps) {
  const [ttlMinutes, setTtlMinutes] = useState(60) // 기본 1시간
  const [validationError, setValidationError] = useState<string>()
  const [copiedCode, setCopiedCode] = useState<string>()
  
  const queryClient = useQueryClient()

  // 활성 코드 조회
  const {
    data: activeCodesData,
    isLoading: isLoadingCodes,
    error: activeCodesError,
    refetch: refetchCodes
  } = useQuery({
    queryKey: ['activeCodes', orgId],
    queryFn: fetchActiveCodes,
    refetchInterval: 30 * 1000, // 30초마다 갱신
    staleTime: 15 * 1000 // 15초 후 stale
  })

  // 코드 생성 뮤테이션
  const generateMutation = useMutation({
    mutationFn: generateCode,
    onSuccess: (data) => {
      // 성공 시 활성 코드 목록 갱신
      queryClient.invalidateQueries({ queryKey: ['activeCodes', orgId] })
      setValidationError(undefined)
    },
    onError: (error: Error) => {
      console.error('코드 생성 실패:', error)
    }
  })

  const handleTTLChange = (value: string) => {
    const numValue = parseInt(value)
    setTtlMinutes(numValue)
    
    if (value) {
      const validation = validateTTL(numValue)
      setValidationError(validation.isValid ? undefined : validation.error)
    } else {
      setValidationError(undefined)
    }
  }

  const handleGenerate = async () => {
    const validation = validateTTL(ttlMinutes)
    if (!validation.isValid) {
      setValidationError(validation.error)
      return
    }

    try {
      await generateMutation.mutateAsync({
        ttlMinutes,
        orgId
      })
    } catch (error) {
      // 에러는 mutation onError에서 처리됨
    }
  }

  const handleCopy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(undefined), 2000) // 2초 후 리셋
    } catch (error) {
      console.error('복사 실패:', error)
    }
  }

  const getRemainingMinutes = (expiresAt: string): number => {
    return Math.max(0, Math.floor((new Date(expiresAt).getTime() - Date.now()) / (60 * 1000)))
  }

  const activeCodes = activeCodesData?.activeCodes || []

  return (
    <Card className={cn('w-full max-w-2xl', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          교실 코드 생성
        </CardTitle>
        <CardDescription>
          <span className="font-medium">{orgName}</span> 학생들이 참여할 수 있는 임시 코드를 생성합니다
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* 코드 생성 폼 */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ttl-input">유효 시간 (분)</Label>
            <Input
              id="ttl-input"
              type="number"
              min="1"
              max="480"
              value={ttlMinutes || ''}
              onChange={(e) => handleTTLChange(e.target.value)}
              placeholder="1~480분 입력"
              className={cn(validationError && 'border-red-500')}
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>최소 1분, 최대 480분(8시간)</span>
              <span>권장: 수업 시간 + 10분</span>
            </div>
          </div>

          {validationError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{validationError}</AlertDescription>
            </Alert>
          )}

          {generateMutation.error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {generateMutation.error.message}
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleGenerate}
            disabled={generateMutation.isPending || !!validationError || !ttlMinutes}
            className="w-full"
          >
            {generateMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            코드 생성
          </Button>
        </div>

        {/* 활성 코드 목록 */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">활성 코드</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetchCodes()}
              disabled={isLoadingCodes}
            >
              {isLoadingCodes ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>

          {activeCodesError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                활성 코드를 불러오는데 실패했습니다
              </AlertDescription>
            </Alert>
          )}

          {activeCodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              활성화된 코드가 없습니다
            </div>
          ) : (
            <div className="space-y-3">
              {activeCodes.map((code) => {
                const remainingMinutes = getRemainingMinutes(code.expires_at)
                const isExpiringSoon = remainingMinutes <= 5
                const isCopied = copiedCode === code.code

                return (
                  <div
                    key={code.code}
                    className="flex items-center justify-between p-4 border rounded-lg bg-gray-50 dark:bg-gray-900"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-mono font-bold tracking-wider">
                          {code.code}
                        </span>
                        <Badge 
                          variant={isExpiringSoon ? "destructive" : "secondary"}
                          className={cn(
                            isExpiringSoon && "bg-orange-100 text-orange-800"
                          )}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {remainingMinutes}분 남음
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500">
                        생성: {new Date(code.created_at).toLocaleString('ko-KR')} |
                        만료: {new Date(code.expires_at).toLocaleString('ko-KR')}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopy(code.code)}
                        className="flex items-center gap-2"
                      >
                        {isCopied ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                        {isCopied ? '복사됨' : '복사'}
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                        onClick={() => {
                          // QR 코드 기능은 추후 구현
                          alert('QR 코드 기능은 곧 추가될 예정입니다')
                        }}
                      >
                        <QrCode className="h-4 w-4" />
                        QR
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 안내사항 */}
        <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <p>• 학생들은 생성된 코드를 입력하여 교실에 참여할 수 있습니다</p>
          <p>• 참여한 학생들에게는 광고가 표시되지 않습니다</p>
          <p>• 코드는 설정한 시간이 지나면 자동으로 만료됩니다</p>
        </div>
      </CardContent>
    </Card>
  )
}
