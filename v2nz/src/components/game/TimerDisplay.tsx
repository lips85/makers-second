'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Clock, AlertTriangle } from 'lucide-react'
import { formatTime } from '@/lib/utils/time'

interface TimerDisplayProps {
  remainingTime: number
  totalTime: number
  isExpired: boolean
  isPaused: boolean
}

export function TimerDisplay({ 
  remainingTime, 
  totalTime, 
  isExpired, 
  isPaused 
}: TimerDisplayProps) {
  const progress = totalTime > 0 ? ((totalTime - remainingTime) / totalTime) * 100 : 0
  const isLowTime = remainingTime <= 10 && remainingTime > 0

  return (
    <Card className="w-full max-w-2xl mx-auto mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              남은 시간
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isPaused && (
              <Badge variant="secondary" className="text-xs">
                일시정지
              </Badge>
            )}
            {isExpired && (
              <Badge variant="destructive" className="text-xs">
                시간 종료
              </Badge>
            )}
            {isLowTime && !isExpired && (
              <Badge variant="destructive" className="text-xs animate-pulse">
                <AlertTriangle className="h-3 w-3 mr-1" />
                시간 부족
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className={`text-2xl font-bold ${
              isExpired ? 'text-red-600' : 
              isLowTime ? 'text-orange-600' : 
              'text-gray-900 dark:text-white'
            }`}>
              {formatTime(remainingTime)}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatTime(totalTime)}
            </span>
          </div>

          <Progress 
            value={progress} 
            className={`h-2 ${
              isExpired ? 'bg-red-100 dark:bg-red-900' :
              isLowTime ? 'bg-orange-100 dark:bg-orange-900' :
              'bg-gray-100 dark:bg-gray-800'
            }`}
          />
        </div>
      </CardContent>
    </Card>
  )
}
