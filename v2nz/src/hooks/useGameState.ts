import { useReducer, useCallback, useMemo, useRef } from 'react'
import { useRoundTimer } from './useRoundTimer'
import { useRandomWordItems } from './useWordItems'
import { processAnswer, type GameStats, type AnswerResult } from '@/lib/game/scoring'
import type { WordItem } from '@/lib/api/word-items'

export type GameState = 'loading' | 'ready' | 'playing' | 'paused' | 'finished' | 'error'

interface GameAction {
  type: 
    | 'START_GAME'
    | 'PAUSE_GAME'
    | 'RESUME_GAME'
    | 'FINISH_GAME'
    | 'SUBMIT_ANSWER'
    | 'NEXT_QUESTION'
    | 'SET_ERROR'
    | 'RESET_GAME'
  payload?: any
}

interface GameStateData {
  state: GameState
  currentQuestionIndex: number
  currentWord: WordItem | null
  stats: GameStats
  lastAnswerResult: AnswerResult | null
  error: string | null
  startTime: number | null
  endTime: number | null
}

const initialStats: GameStats = {
  totalQuestions: 0,
  correctAnswers: 0,
  totalScore: 0,
  accuracy: 0,
  currentCombo: 0,
  maxCombo: 0,
  averageResponseTime: 0,
  totalResponseTime: 0
}

const initialState: GameStateData = {
  state: 'loading',
  currentQuestionIndex: 0,
  currentWord: null,
  stats: initialStats,
  lastAnswerResult: null,
  error: null,
  startTime: null,
  endTime: null
}

function gameReducer(state: GameStateData, action: GameAction): GameStateData {
  switch (action.type) {
    case 'START_GAME':
      return {
        ...state,
        state: 'playing',
        startTime: Date.now(),
        currentQuestionIndex: 0,
        stats: initialStats,
        lastAnswerResult: null,
        error: null
      }

    case 'PAUSE_GAME':
      return {
        ...state,
        state: 'paused'
      }

    case 'RESUME_GAME':
      return {
        ...state,
        state: 'playing'
      }

    case 'FINISH_GAME':
      return {
        ...state,
        state: 'finished',
        endTime: Date.now()
      }

    case 'SUBMIT_ANSWER':
      const { result, newStats } = action.payload
      return {
        ...state,
        stats: newStats,
        lastAnswerResult: result
      }

    case 'NEXT_QUESTION':
      return {
        ...state,
        currentQuestionIndex: state.currentQuestionIndex + 1,
        lastAnswerResult: null
      }

    case 'SET_ERROR':
      return {
        ...state,
        state: 'error',
        error: action.payload
      }

    case 'RESET_GAME':
      return {
        ...initialState,
        state: 'ready'
      }

    default:
      return state
  }
}

interface UseGameStateOptions {
  roundId: string
  duration: number
  wordCount?: number
}

export function useGameState({ roundId, duration, wordCount = 10 }: UseGameStateOptions) {
  const [gameData, dispatch] = useReducer(gameReducer, initialState)
  const questionStartTimeRef = useRef<number>(0)

  // Fetch word items
  const { data: wordItems, isLoading, error: wordError } = useRandomWordItems(wordCount, {
    approved: true
  })

  // Timer hook
  const timer = useRoundTimer({
    duration,
    onExpire: useCallback(() => {
      dispatch({ type: 'FINISH_GAME' })
    }, []),
    onTick: useCallback((remainingTime) => {
      // Optional: Add any timer tick logic here
    }, [])
  })

  // Memoized current word
  const currentWord = useMemo(() => {
    if (!wordItems || gameData.currentQuestionIndex >= wordItems.length) {
      return null
    }
    return wordItems[gameData.currentQuestionIndex]
  }, [wordItems, gameData.currentQuestionIndex])

  // Update current word when it changes
  const updateCurrentWord = useCallback(() => {
    if (currentWord) {
      questionStartTimeRef.current = Date.now()
    }
  }, [currentWord])

  // Memoized selectors for performance
  const isGameActive = useMemo(() => 
    gameData.state === 'playing', [gameData.state]
  )

  const isGameFinished = useMemo(() => 
    gameData.state === 'finished', [gameData.state]
  )

  const canSubmitAnswer = useMemo(() => 
    isGameActive && currentWord !== null, [isGameActive, currentWord]
  )

  const totalTime = useMemo(() => {
    if (!gameData.startTime || !gameData.endTime) return 0
    return Math.round((gameData.endTime - gameData.startTime) / 1000)
  }, [gameData.startTime, gameData.endTime])

  // Game actions
  const startGame = useCallback(() => {
    if (wordItems && wordItems.length > 0) {
      dispatch({ type: 'START_GAME' })
      timer.start()
      updateCurrentWord()
    }
  }, [wordItems, timer, updateCurrentWord])

  const pauseGame = useCallback(() => {
    dispatch({ type: 'PAUSE_GAME' })
    timer.pause()
  }, [timer])

  const resumeGame = useCallback(() => {
    dispatch({ type: 'RESUME_GAME' })
    timer.resume()
  }, [timer])

  const submitAnswer = useCallback((answer: string) => {
    if (!currentWord || !canSubmitAnswer) return

    const responseTime = Date.now() - questionStartTimeRef.current
    const { result, newStats } = processAnswer(
      answer,
      currentWord.meaning,
      responseTime,
      gameData.stats.currentCombo,
      timer.remainingTime,
      gameData.stats
    )

    dispatch({ type: 'SUBMIT_ANSWER', payload: { result, newStats } })

    // Move to next question after a short delay
    setTimeout(() => {
      if (gameData.currentQuestionIndex < (wordItems?.length || 0) - 1) {
        dispatch({ type: 'NEXT_QUESTION' })
        updateCurrentWord()
      } else {
        dispatch({ type: 'FINISH_GAME' })
      }
    }, 1000)
  }, [currentWord, canSubmitAnswer, gameData.stats, gameData.currentQuestionIndex, timer.remainingTime, wordItems, updateCurrentWord])

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' })
    timer.reset()
  }, [timer])

  // Error handling
  if (wordError) {
    dispatch({ type: 'SET_ERROR', payload: wordError.message })
  }

  // Set game to ready when word items are loaded and game is in loading state
  if (!isLoading && wordItems && wordItems.length > 0 && gameData.state === 'loading') {
    dispatch({ type: 'RESET_GAME' })
  }

  // Update current word when it changes
  if (currentWord && gameData.currentWord !== currentWord) {
    updateCurrentWord()
  }

  return {
    // State
    gameState: gameData.state,
    currentWord,
    stats: gameData.stats,
    lastAnswerResult: gameData.lastAnswerResult,
    error: gameData.error,
    isLoading,
    
    // Computed values
    isGameActive,
    isGameFinished,
    canSubmitAnswer,
    totalTime,
    progress: gameData.currentQuestionIndex / (wordItems?.length || 1),
    
    // Actions
    startGame,
    pauseGame,
    resumeGame,
    submitAnswer,
    resetGame,
    
    // Timer
    timer,
    
    // Word items
    wordItems,
    totalQuestions: wordItems?.length || 0
  }
}
