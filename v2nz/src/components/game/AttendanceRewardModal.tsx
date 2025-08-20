import React from 'react'
import { X, Calendar, Zap, Trophy, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

export interface AttendanceRewardData {
  isNew: boolean
  attendDate: string
  streakBefore: number
  streakAfter: number
  rewardPoints: number
  totalPoints: number
}

interface AttendanceRewardModalProps {
  data: AttendanceRewardData
  isOpen: boolean
  onClose: () => void
}

export function AttendanceRewardModal({ data, isOpen, onClose }: AttendanceRewardModalProps) {
  if (!isOpen) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  const getStreakMessage = (streak: number) => {
    if (streak === 1) return '첫 번째 출석!'
    if (streak <= 3) return `${streak}일 연속 출석!`
    if (streak <= 7) return `${streak}일 연속 출석! 대단해요!`
    if (streak <= 14) return `${streak}일 연속 출석! 정말 열심히 하고 있어요!`
    return `${streak}일 연속 출석! 완전히 습관이 되었네요!`
  }

  const getRewardMessage = (points: number) => {
    if (points <= 10) return '기본 보상'
    if (points <= 20) return '연속 출석 보너스!'
    if (points <= 30) return '열심히 하는 당신에게!'
    return '완벽한 출석! 특별 보상!'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md mx-4">
        <Card className="relative overflow-hidden border-0 shadow-2xl">
          {/* 배경 그라데이션 */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-pink-500/10" />
          
          <CardHeader className="relative pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100">
                출석 보상
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0 hover:bg-gray-100 dark:hover:bg-gray-800"
                aria-label="닫기"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* 날짜 표시 */}
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(data.attendDate)}</span>
            </div>
          </CardHeader>

          <CardContent className="relative space-y-6">
            {/* 연속 출석 정보 */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {getStreakMessage(data.streakAfter)}
                </span>
              </div>
              
              {/* 연속 출석 진행률 */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">연속 출석</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {data.streakAfter}일
                  </span>
                </div>
                <Progress 
                  value={Math.min(data.streakAfter * 10, 100)} 
                  className="h-2"
                />
              </div>
            </div>

            {/* 보상 포인트 */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-800">
              <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2">
                  <Star className="h-6 w-6 text-yellow-500" />
                  <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    +{data.rewardPoints}점
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {getRewardMessage(data.rewardPoints)}
                </p>
              </div>
            </div>

            {/* 누적 포인트 */}
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-500" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    누적 포인트
                  </span>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {data.totalPoints.toLocaleString()}점
                </Badge>
              </div>
            </div>

            {/* 연속 출석 배지 */}
            {data.streakAfter >= 7 && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="h-6 w-6 text-purple-500" />
                    <span className="font-semibold text-purple-700 dark:text-purple-300">
                      {data.streakAfter >= 30 ? '마스터' : 
                       data.streakAfter >= 14 ? '전문가' : 
                       data.streakAfter >= 7 ? '열심히' : ''} 배지 획득!
                    </span>
                  </div>
                  <p className="text-xs text-purple-600 dark:text-purple-400">
                    {data.streakAfter}일 연속 출석 달성
                  </p>
                </div>
              </div>
            )}

            {/* 확인 버튼 */}
            <Button 
              onClick={onClose}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium"
            >
              확인
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
