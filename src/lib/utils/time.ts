/**
 * Format seconds to MM:SS format (with smooth updates)
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  
  return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
}

/**
 * Format seconds to MM:SS.ss format (with milliseconds for ultra smooth display)
 */
export function formatTimeSmooth(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  const wholeSeconds = Math.floor(remainingSeconds)
  const milliseconds = Math.floor((remainingSeconds - wholeSeconds) * 100)
  
  return `${minutes.toString().padStart(2, '0')}:${wholeSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
}

/**
 * Format milliseconds to human readable format
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`
  }
  
  const seconds = Math.floor(milliseconds / 1000)
  const remainingMs = milliseconds % 1000
  
  if (seconds < 60) {
    return `${seconds}.${remainingMs.toString().padStart(3, '0')}s`
  }
  
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  return `${minutes}m ${remainingSeconds}s`
}

/**
 * Get time remaining as percentage
 */
export function getTimeRemainingPercentage(remaining: number, total: number): number {
  if (total <= 0) return 0
  return Math.max(0, Math.min(100, (remaining / total) * 100))
}
