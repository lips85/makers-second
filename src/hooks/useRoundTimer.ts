import { useState, useEffect, useRef, useCallback } from 'react'

export type TimerState = 'idle' | 'running' | 'paused' | 'expired'

interface UseRoundTimerOptions {
  duration: number // in seconds
  onExpire?: () => void
  onTick?: (remainingTime: number) => void
}

interface UseRoundTimerReturn {
  remainingTime: number // in seconds (with decimals)
  elapsedTime: number // in seconds (with decimals)
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
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const pauseTimeRef = useRef<number | null>(null)
  const totalPausedTimeRef = useRef<number>(0)
  const onExpireRef = useRef(onExpire)
  const onTickRef = useRef(onTick)

  // Update refs when callbacks change
  useEffect(() => {
    onExpireRef.current = onExpire
    onTickRef.current = onTick
  }, [onExpire, onTick])

  const updateTimer = useCallback(() => {
    if (!startTimeRef.current) return

    const now = Date.now()
    const elapsedMs = now - startTimeRef.current - totalPausedTimeRef.current
    const elapsed = elapsedMs / 1000 // Convert to seconds with decimals
    const remainingSeconds = Math.max(0, duration - elapsed)

    setRemainingTime(remainingSeconds)
    setElapsedTime(elapsed)

    // Call onTick callback
    if (onTickRef.current) {
      onTickRef.current(remainingSeconds)
    }

    // Check if timer expired
    if (remainingSeconds <= 0) {
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
  }, [duration])

  const start = useCallback(() => {
    if (state === 'running') return

    const now = Date.now()
    startTimeRef.current = now
    pauseTimeRef.current = null
    totalPausedTimeRef.current = 0
    setState('running')

    // Start the interval with 100ms updates for smooth progress (10fps)
    intervalRef.current = setInterval(updateTimer, 100)
  }, [state, updateTimer])

  const pause = useCallback(() => {
    if (state !== 'running') return

    const now = Date.now()
    pauseTimeRef.current = now
    setState('paused')

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [state])

  const resume = useCallback(() => {
    if (state !== 'paused') return

    const now = Date.now()
    if (pauseTimeRef.current) {
      const pauseDuration = now - pauseTimeRef.current
      totalPausedTimeRef.current += pauseDuration
    }
    
    pauseTimeRef.current = null
    setState('running')

    // Restart the interval with 100ms updates (10fps)
    intervalRef.current = setInterval(updateTimer, 100)
  }, [state, updateTimer])

  const reset = useCallback(() => {
    setRemainingTime(duration)
    setElapsedTime(0)
    setState('idle')
    startTimeRef.current = null
    pauseTimeRef.current = null
    totalPausedTimeRef.current = 0

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [duration])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

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
