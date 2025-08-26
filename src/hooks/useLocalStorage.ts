import { useState, useEffect, useCallback, useRef } from 'react'

interface UseLocalStorageOptions<T> {
  key: string
  defaultValue: T
  serialize?: (value: T) => string
  deserialize?: (value: string) => T
  onError?: (error: Error) => void
  debounceMs?: number
}

interface UseLocalStorageReturn<T> {
  value: T
  setValue: (value: T | ((prev: T) => T)) => void
  removeValue: () => void
  isLoading: boolean
  error: string | null
}

/**
 * SSR/CSR 안전한 로컬 스토리지 훅
 */
export function useLocalStorage<T>(
  options: UseLocalStorageOptions<T>
): UseLocalStorageReturn<T> {
  const {
    key,
    defaultValue,
    serialize = JSON.stringify,
    deserialize = JSON.parse,
    onError,
    debounceMs = 1000
  } = options

  const [value, setValueState] = useState<T>(defaultValue)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const isMounted = useRef(false)
  const debounceTimeoutRef = useRef<NodeJS.Timeout>()
  const isClient = typeof window !== 'undefined'

  // 초기 로드
  useEffect(() => {
    if (!isClient) {
      setIsLoading(false)
      return
    }

    try {
      const storedValue = localStorage.getItem(key)
      if (storedValue !== null) {
        const parsedValue = deserialize(storedValue)
        setValueState(parsedValue)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '로컬 스토리지 읽기 실패'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
      
      // 파싱 실패 시 기본값으로 초기화
      setValueState(defaultValue)
    } finally {
      setIsLoading(false)
      isMounted.current = true
    }
  }, [key, defaultValue, deserialize, onError, isClient])

  // 디바운스된 쓰기 함수
  const debouncedSetValue = useCallback((newValue: T) => {
    if (!isClient) return

    try {
      const serializedValue = serialize(newValue)
      localStorage.setItem(key, serializedValue)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '로컬 스토리지 쓰기 실패'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
    }
  }, [key, serialize, onError, isClient])

  // 값 설정 함수
  const setValue = useCallback((newValue: T | ((prev: T) => T)) => {
    const resolvedValue = typeof newValue === 'function' 
      ? (newValue as (prev: T) => T)(value)
      : newValue

    setValueState(resolvedValue)

    // 디바운스 처리
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current)
    }

    debounceTimeoutRef.current = setTimeout(() => {
      debouncedSetValue(resolvedValue)
    }, debounceMs)
  }, [value, debounceMs, debouncedSetValue])

  // 값 제거 함수
  const removeValue = useCallback(() => {
    if (!isClient) return

    try {
      localStorage.removeItem(key)
      setValueState(defaultValue)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '로컬 스토리지 삭제 실패'
      setError(errorMessage)
      onError?.(err instanceof Error ? err : new Error(errorMessage))
    }
  }, [key, defaultValue, onError, isClient])

  // 컴포넌트 언마운트 시 디바운스 정리
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current)
      }
    }
  }, [])

  // 다른 탭에서의 변경 감지
  useEffect(() => {
    if (!isClient || !isMounted.current) return

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const parsedValue = deserialize(e.newValue)
          setValueState(parsedValue)
          setError(null)
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : '스토리지 변경 파싱 실패'
          setError(errorMessage)
          onError?.(err instanceof Error ? err : new Error(errorMessage))
        }
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [key, deserialize, onError, isClient])

  return {
    value,
    setValue,
    removeValue,
    isLoading,
    error
  }
}

/**
 * 로컬 스토리지 유틸리티 함수들
 */

/**
 * 로컬 스토리지에서 값을 안전하게 읽기
 */
export function safeGetFromStorage<T>(
  key: string,
  defaultValue: T,
  deserialize: (value: string) => T = JSON.parse
): T {
  if (typeof window === 'undefined') {
    return defaultValue
  }

  try {
    const storedValue = localStorage.getItem(key)
    if (storedValue === null) {
      return defaultValue
    }
    return deserialize(storedValue)
  } catch (err) {
    console.warn(`로컬 스토리지 읽기 실패 (${key}):`, err)
    return defaultValue
  }
}

/**
 * 로컬 스토리지에 값을 안전하게 쓰기
 */
export function safeSetToStorage<T>(
  key: string,
  value: T,
  serialize: (value: T) => string = JSON.stringify
): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    const serializedValue = serialize(value)
    localStorage.setItem(key, serializedValue)
    return true
  } catch (err) {
    console.warn(`로컬 스토리지 쓰기 실패 (${key}):`, err)
    return false
  }
}

/**
 * 로컬 스토리지에서 값을 안전하게 삭제
 */
export function safeRemoveFromStorage(key: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    localStorage.removeItem(key)
    return true
  } catch (err) {
    console.warn(`로컬 스토리지 삭제 실패 (${key}):`, err)
    return false
  }
}

/**
 * 로컬 스토리지 키 존재 여부 확인
 */
export function hasStorageKey(key: string): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  try {
    return localStorage.getItem(key) !== null
  } catch (err) {
    console.warn(`로컬 스토리지 키 확인 실패 (${key}):`, err)
    return false
  }
}

/**
 * 로컬 스토리지 사용량 확인 (브라우저 지원 시)
 */
export function getStorageUsage(): { used: number; available: number } | null {
  if (typeof window === 'undefined' || !('storage' in navigator)) {
    return null
  }

  try {
    // 브라우저가 지원하는 경우에만 사용량 확인
    const estimate = (navigator as any).storage?.estimate?.()
    if (estimate) {
      return {
        used: estimate.usage || 0,
        available: estimate.quota || 0
      }
    }
  } catch (err) {
    console.warn('스토리지 사용량 확인 실패:', err)
  }

  return null
}
