'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Pause, RotateCcw, Clock, AlertTriangle } from 'lucide-react'
import Link from 'next/link'
import { useGameState } from '@/hooks/useGameState'
import { useAttendanceCheckin } from '@/hooks/useAttendanceCheckin'
import { TimerDisplay } from './TimerDisplay'
import { AnswerInput } from './AnswerInput'
import { GameResultModal } from './GameResultModal'
import { AttendanceRewardModal } from './AttendanceRewardModal'
import type { SubmitRoundResponse } from '@/lib/game/submit-round-schema'
import { Progress } from '@/components/ui/progress'

interface RoundGameProps {
  roundId: string
  duration: number
}

export function RoundGame({ roundId, duration }: RoundGameProps) {
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultData, setResultData] = useState<SubmitRoundResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAttendanceReward, setShowAttendanceReward] = useState(false)
  const [attendanceRewardData, setAttendanceRewardData] = useState<any>(null)
  
  const { checkin } = useAttendanceCheckin()
  
  const {
    gameState,
    currentWord,
    stats,
    lastAnswerResult,
    error,
    isLoading,
    isGameActive,
    isGameFinished,
    canSubmitAnswer,
    totalTime,
    progress,
    startGame,
    pauseGame,
    resumeGame,
    submitAnswer,
    resetGame,
    timer,
    totalQuestions,
    wordItems
  } = useGameState({ roundId, duration })

  // Submit round data when game finishes
  useEffect(() => {
    if (isGameFinished && !isSubmitting && wordItems) {
      const submitRoundData = async () => {
        setIsSubmitting(true)
        try {
          const roundData = {
            durationSec: duration,
            totalQuestions: stats.totalQuestions,
            correctAnswers: stats.correctAnswers,
            items: wordItems.map((item, index) => ({
              isCorrect: index < stats.correctAnswers,
              responseTimeMs: Math.round(stats.averageResponseTime),
              score: Math.round(stats.totalScore / stats.totalQuestions)
            })),
            startTime: new Date(Date.now() - totalTime * 1000).toISOString(),
            endTime: new Date().toISOString(),
            clientCalculatedScore: stats.totalScore,
            roundId: roundId,
            wordItems: wordItems.map(item => ({
              id: item.id,
              word: item.word,
              meaning: item.meaning
            }))
          }

          const response = await fetch('/api/submitRound', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(roundData),
          })

          if (response.ok) {
            const result = await response.json()
            setResultData(result)
            setShowResultModal(true)
            
            // 라운드 제출 성공 후 출석 체크 시도
            try {
              const attendanceResult = await checkin()
              if (attendanceResult && attendanceResult.isNew) {
                setAttendanceRewardData(attendanceResult)
                setShowAttendanceReward(true)
              }
            } catch (attendanceError) {
              console.warn('출석 체크 실패:', attendanceError)
              // 출석 체크 실패는 라운드 결과에 영향을 주지 않음
            }
          } else {
            console.error('Failed to submit round data')
            // API 오류 시에도 결과 모달을 표시하되, 서버 데이터 없이
            setShowResultModal(true)
          }
        } catch (error) {
          console.error('Error submitting round data:', error)
          // 네트워크 오류 시에도 결과 모달을 표시하되, 서버 데이터 없이
          setShowResultModal(true)
        } finally {
          setIsSubmitting(false)
        }
      }

      submitRoundData()
    }
  }, [isGameFinished, wordItems, stats, duration, totalTime, roundId])

  const handleRestart = () => {
    setShowResultModal(false)
    resetGame()
    startGame()
  }

  const handleSubmitAnswer = async (answer: string) => {
    submitAnswer(answer)
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">게임을 준비하고 있습니다...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">오류가 발생했습니다</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <div className="flex gap-2">
                <Button asChild variant="outline">
                  <Link href="/">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    홈으로 돌아가기
                  </Link>
                </Button>
                <Button onClick={() => window.location.reload()}>
                  다시 시도
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              홈으로
            </Link>
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              라운드 {roundId}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {duration}초 퀴즈
            </p>
          </div>
          <div className="w-20"></div> {/* Spacer for centering */}
        </div>
      </header>

      {/* Game Controls */}
      {gameState === 'ready' && (
        <div className="max-w-2xl mx-auto mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">게임 준비 완료</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600 dark:text-gray-400">
                {totalQuestions}개의 단어로 {duration}초 퀴즈를 시작합니다.
              </p>
              <div className="flex gap-2 justify-center">
                <Button onClick={startGame} size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  게임 시작
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Answer Input - Only show when game is active (not paused) */}
      {currentWord && isGameActive && (
        <div className="max-w-2xl mx-auto mb-3">
          <AnswerInput
            currentWord={currentWord}
            combo={stats.currentCombo}
            onSubmit={handleSubmitAnswer}
            disabled={!canSubmitAnswer || timer.state === 'expired'}
            isLoading={false}
          />
        </div>
      )}

      {/* Game Controls */}
      {(isGameActive || gameState === 'paused') && (
        <div className="max-w-2xl mx-auto mb-3">
          <div className="flex gap-2 justify-center">
            {timer.state === 'running' ? (
              <Button onClick={pauseGame} variant="outline" size="sm">
                <Pause className="h-4 w-4 mr-2" />
                일시정지
              </Button>
            ) : (
              <Button onClick={resumeGame} variant="outline" size="sm">
                <Play className="h-4 w-4 mr-2" />
                계속하기
              </Button>
            )}
            <Button onClick={resetGame} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-2" />
              다시 시작
            </Button>
          </div>
        </div>
      )}

      {/* Timer, Progress & Stats - Combined Card */}
      {(isGameActive || gameState === 'paused' || isGameFinished) && (
        <div className="max-w-2xl mx-auto mb-3">
          <Card>
            <CardContent className="p-3">
              {/* Timer Section */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      남은 시간
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {timer.state === 'paused' && (
                      <Badge variant="secondary" className="text-xs">
                        일시정지
                      </Badge>
                    )}
                    {timer.state === 'expired' && (
                      <Badge variant="destructive" className="text-xs">
                        시간 종료
                      </Badge>
                    )}
                    {timer.remainingTime <= 10 && timer.remainingTime > 0 && timer.state !== 'expired' && (
                      <Badge variant="destructive" className="text-xs animate-pulse">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        시간 부족
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xl font-bold transition-colors duration-200 ${
                      timer.state === 'expired' ? 'text-red-600' : 
                      timer.remainingTime <= 10 && timer.remainingTime > 0 ? 'text-orange-600' : 
                      'text-gray-900 dark:text-white'
                    }`}>
                      {formatTime(timer.remainingTime)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatTime(duration)}
                    </span>
                  </div>
                  <Progress 
                    value={duration > 0 ? ((duration - timer.remainingTime) / duration) * 100 : 0} 
                    className={`h-2 transition-all duration-200 ease-out ${
                      timer.state === 'expired' ? 'bg-red-100 dark:bg-red-900' :
                      timer.remainingTime <= 10 && timer.remainingTime > 0 ? 'bg-red-100 dark:bg-red-900 animate-pulse' :
                      'bg-gray-100 dark:bg-gray-800'
                    }`}
                    indicatorColor={
                      timer.state === 'expired' ? 'bg-red-600' :
                      timer.remainingTime <= 10 && timer.remainingTime > 0 ? 'bg-red-600' :
                      'bg-blue-600'
                    }
                  />
                </div>
              </div>

              {/* Progress Section */}
              <div className="mb-3">
                <div className="flex gap-1">
                  {Array.from({ length: totalQuestions }, (_, index) => {
                    // 현재 문제까지의 정답/오답 상태를 확인
                    const isCompleted = index < stats.totalQuestions;
                    const isCorrect = index < stats.correctAnswers;
                    
                    return (
                      <div
                        key={index}
                        className={`flex-1 h-3 rounded-sm border transition-all duration-300 ${
                          isCompleted
                            ? isCorrect
                              ? 'bg-blue-600 border-blue-600' // 정답: 파란색
                              : 'bg-red-600 border-red-600'   // 오답: 빨간색
                            : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600' // 미완료: 회색
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Stats Section */}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xl font-bold text-blue-600">
                    {stats.totalScore.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">총 점수</p>
                </div>
                <div>
                  <div className="text-xl font-bold text-green-600">
                    {stats.accuracy.toFixed(1)}%
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">정확도</p>
                </div>
                <div>
                  <div className="text-xl font-bold text-purple-600">
                    {stats.maxCombo}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">최대 콤보</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Answer Feedback */}
      {lastAnswerResult && (
        <div className="max-w-2xl mx-auto mb-3">
          <Card className={`${
            lastAnswerResult.isCorrect 
              ? 'border-green-200 bg-green-50 dark:bg-green-900/20' 
              : 'border-red-200 bg-red-50 dark:bg-red-900/20'
          }`}>
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant={lastAnswerResult.isCorrect ? 'default' : 'destructive'}>
                    {lastAnswerResult.isCorrect ? '정답!' : '오답'}
                  </Badge>
                  {lastAnswerResult.isCorrect && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      +{lastAnswerResult.score}점
                    </span>
                  )}
                </div>
                {lastAnswerResult.combo > 1 && (
                  <Badge variant="secondary">
                    {lastAnswerResult.combo} 콤보!
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Loading Modal */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md mx-auto">
            <CardContent className="p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">결과를 처리하고 있습니다...</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Result Modal */}
      <GameResultModal
        stats={stats}
        totalTime={totalTime}
        onRestart={handleRestart}
        isOpen={showResultModal}
        percentileStats={resultData?.percentileStats}
        leaderboard={resultData?.leaderboard}
      />

      {/* Attendance Reward Modal */}
      {attendanceRewardData && (
        <AttendanceRewardModal
          data={attendanceRewardData}
          isOpen={showAttendanceReward}
          onClose={() => setShowAttendanceReward(false)}
        />
      )}
    </div>
  )
}
