'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Zap, Target } from 'lucide-react'
import type { WordItem } from '@/lib/api/word-items'

interface AnswerInputProps {
  currentWord: WordItem
  combo: number
  onSubmit: (answer: string) => void
  disabled?: boolean
  isLoading?: boolean
}

export function AnswerInput({ 
  currentWord, 
  combo, 
  onSubmit, 
  disabled = false,
  isLoading = false 
}: AnswerInputProps) {
  const [answer, setAnswer] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!answer.trim() || disabled || isLoading || isSubmitting) {
      return
    }

    setIsSubmitting(true)
    
    try {
      await onSubmit(answer.trim())
      setAnswer('')
      // Focus will be maintained by useEffect
    } catch (error) {
      console.error('Error submitting answer:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  // Maintain focus after submission
  useEffect(() => {
    if (!isSubmitting && !disabled && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isSubmitting, disabled])

  // Focus on mount
  useEffect(() => {
    if (inputRef.current && !disabled) {
      inputRef.current.focus()
    }
  }, [disabled])

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-center flex-1">
            {currentWord.word}
          </CardTitle>
          {combo > 0 && (
            <Badge variant="secondary" className="ml-4">
              <Zap className="h-3 w-3 mr-1" />
              {combo} 콤보
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="answer" className="text-sm font-medium">
              이 단어의 뜻을 입력하세요
            </Label>
            <div className="relative">
              <Input
                ref={inputRef}
                id="answer"
                type="text"
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="정답을 입력하세요..."
                disabled={disabled || isLoading || isSubmitting}
                className="text-lg py-3 px-4"
                aria-describedby="answer-help"
                aria-live="polite"
                aria-label={`${currentWord.word}의 뜻을 입력하세요`}
              />
              {isSubmitting && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
            <p id="answer-help" className="text-sm text-gray-500 dark:text-gray-400">
              Enter 키를 누르거나 제출 버튼을 클릭하세요
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={!answer.trim() || disabled || isLoading || isSubmitting}
              className="flex-1"
              size="lg"
            >
              <Target className="h-4 w-4 mr-2" />
              {isSubmitting ? '제출 중...' : '정답 제출'}
            </Button>
          </div>
        </form>

        {/* Word Info */}
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              난이도: 
              <Badge variant="outline" className="ml-1">
                {currentWord.difficulty === 'easy' && '쉬움'}
                {currentWord.difficulty === 'medium' && '보통'}
                {currentWord.difficulty === 'hard' && '어려움'}
              </Badge>
            </span>
            {currentWord.category && (
              <span className="text-gray-600 dark:text-gray-400">
                카테고리: {currentWord.category}
              </span>
            )}
          </div>
          {currentWord.example_sentence && (
            <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              <strong>예문:</strong> {currentWord.example_sentence}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
