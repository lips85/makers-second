'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Play, Pause, RotateCcw } from 'lucide-react'
import Link from 'next/link'
import { useGameState } from '@/hooks/useGameState'
import { TimerDisplay } from './TimerDisplay'
import { AnswerInput } from './AnswerInput'
import { GameResultModal } from './GameResultModal'
import type { SubmitRoundResponse } from '@/lib/game/submit-round-schema'

interface RoundGameProps {
  roundId: string
  duration: number
}

export function RoundGame({ roundId, duration }: RoundGameProps) {
  const [showResultModal, setShowResultModal] = useState(false)
  const [resultData, setResultData] = useState<SubmitRoundResponse | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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

      {/* Timer Display */}
      {(isGameActive || gameState === 'paused' || isGameFinished) && (
        <TimerDisplay
          remainingTime={timer.remainingTime}
          totalTime={duration}
          isExpired={timer.state === 'expired'}
          isPaused={timer.state === 'paused'}
        />
      )}

      {/* Game Progress */}
      {isGameActive && (
        <div className="max-w-2xl mx-auto mb-6">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>진행률: {Math.round(progress * 100)}%</span>
            <span>문제 {stats.totalQuestions + 1} / {totalQuestions}</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Game Controls */}
      {isGameActive && (
        <div className="max-w-2xl mx-auto mb-6">
          <div className="flex gap-2 justify-center">
            {timer.state === 'running' ? (
              <Button onClick={pauseGame} variant="outline">
                <Pause className="h-4 w-4 mr-2" />
                일시정지
              </Button>
            ) : (
              <Button onClick={resumeGame} variant="outline">
                <Play className="h-4 w-4 mr-2" />
                계속하기
              </Button>
            )}
            <Button onClick={resetGame} variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              다시 시작
            </Button>
          </div>
        </div>
      )}

      {/* Answer Input */}
      {currentWord && (isGameActive || gameState === 'paused') && (
        <AnswerInput
          currentWord={currentWord}
          combo={stats.currentCombo}
          onSubmit={handleSubmitAnswer}
          disabled={!canSubmitAnswer || timer.state === 'expired'}
          isLoading={false}
        />
      )}

      {/* Answer Feedback */}
      {lastAnswerResult && (
        <div className="max-w-2xl mx-auto mt-4">
          <Card className={`${
            lastAnswerResult.isCorrect 
              ? 'border-green-200 bg-green-50 dark:bg-green-900/20' 
              : 'border-red-200 bg-red-50 dark:bg-red-900/20'
          }`}>
            <CardContent className="p-4">
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

      {/* Game Stats */}
      {isGameActive && (
        <div className="max-w-2xl mx-auto mt-6">
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {stats.totalScore.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">총 점수</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {stats.accuracy.toFixed(1)}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">정확도</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {stats.maxCombo}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">최대 콤보</p>
                </div>
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
    </div>
  )
}
