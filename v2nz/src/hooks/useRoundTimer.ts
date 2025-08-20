import { useState, useEffect, useRef, useCallback } from 'react'
import { differenceInMilliseconds, addSeconds } from 'date-fns'

export type TimerState = 'idle' | 'running' | 'paused' | 'expired'

interface UseRoundTimerOptions {
  duration: number // in seconds
  onExpire?: () => void
  onTick?: (remainingTime: number) => void
}

interface UseRoundTimerReturn {
  remainingTime: number // in seconds
  elapsedTime: number // in seconds
  progress: number // 0 to 1
  state: TimerState
  start: () => void
  pause: () => void
  reset: () => void
  resume: () => void
}

export function useRoundTimer({ 
  duration, 
  onExpire, 
  onTick 
}: UseRoundTimerOptions): UseRoundTimerReturn {
  const [state, setState] = useState<TimerState>('idle')
  const [remainingTime, setRemainingTime] = useState(duration)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [pauseTime, setPauseTime] = useState<Date | null>(null)
  const [totalPausedTime, setTotalPausedTime] = useState(0)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const onExpireRef = useRef(onExpire)
  const onTickRef = useRef(onTick)

  // Update refs when callbacks change
  useEffect(() => {
    onExpireRef.current = onExpire
    onTickRef.current = onTick
  }, [onExpire, onTick])

  // Reset when duration changes
  useEffect(() => {
    setRemainingTime(duration)
    setElapsedTime(0)
    setState('idle')
    setStartTime(null)
    setPauseTime(null)
    setTotalPausedTime(0)
  }, [duration])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const calculateRemainingTime = useCallback((now: Date): number => {
    if (!startTime) return duration

    const actualElapsed = differenceInMilliseconds(now, startTime) - totalPausedTime
    const remaining = Math.max(0, duration * 1000 - actualElapsed)
    
    return Math.ceil(remaining / 1000)
  }, [startTime, totalPausedTime, duration])

  const updateTimer = useCallback(() => {
    const now = new Date()
    const remaining = calculateRemainingTime(now)
    const elapsed = duration - remaining

    setRemainingTime(remaining)
    setElapsedTime(elapsed)

    // Call onTick callback
    if (onTickRef.current) {
      onTickRef.current(remaining)
    }

    // Check if timer expired
    if (remaining <= 0) {
      setState('expired')
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      
      // Call onExpire callback
      if (onExpireRef.current) {
        onExpireRef.current()
      }
    }
  }, [calculateRemainingTime, duration])

  const start = useCallback(() => {
    if (state === 'running') return

    const now = new Date()
    setStartTime(now)
    setPauseTime(null)
    setTotalPausedTime(0)
    setState('running')

    // Start the interval
    intervalRef.current = setInterval(updateTimer, 100) // Update every 100ms for smooth progress
  }, [state, updateTimer])

  const pause = useCallback(() => {
    if (state !== 'running') return

    const now = new Date()
    setPauseTime(now)
    setState('paused')

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [state])

  const resume = useCallback(() => {
    if (state !== 'paused') return

    const now = new Date()
    if (pauseTime) {
      const pauseDuration = differenceInMilliseconds(now, pauseTime)
      setTotalPausedTime(prev => prev + pauseDuration)
    }
    
    setPauseTime(null)
    setState('running')

    // Restart the interval
    intervalRef.current = setInterval(updateTimer, 100)
  }, [state, pauseTime, updateTimer])

  const reset = useCallback(() => {
    setRemainingTime(duration)
    setElapsedTime(0)
    setState('idle')
    setStartTime(null)
    setPauseTime(null)
    setTotalPausedTime(0)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [duration])

  // Calculate progress (0 to 1)
  const progress = duration > 0 ? elapsedTime / duration : 0

  return {
    remainingTime,
    elapsedTime,
    progress,
    state,
    start,
    pause,
    reset,
    resume
  }
}
