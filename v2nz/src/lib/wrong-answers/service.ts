import React from 'react'
import { EventEmitter } from 'events'
import { 
  WrongAnswerItem, 
  WrongAnswerStore, 
  DEFAULT_WRONG_ANSWER_STORE,
  WRONG_ANSWERS_STORAGE_KEY,
  mergeWrongAnswerItems,
  sortWrongAnswerItems,
  filterWrongAnswerItems,
  validateWrongAnswerStore,
  createWrongAnswerItem,
  markWrongAnswerAsMastered,
  incrementWrongAnswerCount
} from './types'
import { useLocalStorage } from '@/hooks/useLocalStorage'

// 이벤트 타입 정의
export type WrongAnswerEventType = 
  | 'item-added'
  | 'item-updated'
  | 'item-removed'
  | 'item-mastered'
  | 'store-cleared'
  | 'store-loaded'

export interface WrongAnswerEvent {
  type: WrongAnswerEventType
  item?: WrongAnswerItem
  items?: WrongAnswerItem[]
  store?: WrongAnswerStore
}

/**
 * 오답 기록 서비스 클래스
 */
export class WrongAnswerService extends EventEmitter {
  private store: WrongAnswerStore = DEFAULT_WRONG_ANSWER_STORE
  private isInitialized = false

  constructor() {
    super()
    this.loadFromStorage()
  }

  /**
   * 로컬 스토리지에서 데이터 로드
   */
  private loadFromStorage(): void {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(WRONG_ANSWERS_STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        const validation = validateWrongAnswerStore(parsed)
        
        if (validation.isValid) {
          this.store = parsed
        } else {
          console.warn('오답 노트 데이터 검증 실패:', validation.errors)
          this.store = DEFAULT_WRONG_ANSWER_STORE
        }
      }
    } catch (err) {
      console.warn('오답 노트 로드 실패:', err)
      this.store = DEFAULT_WRONG_ANSWER_STORE
    }

    this.isInitialized = true
    this.emit('store-loaded', { type: 'store-loaded', store: this.store })
  }

  /**
   * 로컬 스토리지에 데이터 저장
   */
  private saveToStorage(): void {
    if (typeof window === 'undefined') return

    try {
      this.store.lastUpdated = new Date().toISOString()
      localStorage.setItem(WRONG_ANSWERS_STORAGE_KEY, JSON.stringify(this.store))
    } catch (err) {
      console.error('오답 노트 저장 실패:', err)
    }
  }

  /**
   * 오답 아이템 추가/업데이트
   */
  recordWrongAnswer(wordItem: {
    id: string
    word: string
    meaning: string
    difficulty: 'easy' | 'medium' | 'hard'
    category?: string
  }): WrongAnswerItem {
    const newItem = createWrongAnswerItem(wordItem)
    const existingItem = this.store.items.find(item => item.id === wordItem.id)

    let updatedItem: WrongAnswerItem

    if (existingItem) {
      // 기존 아이템이 있으면 틀린 횟수 증가
      updatedItem = incrementWrongAnswerCount(existingItem)
      this.store.items = this.store.items.map(item => 
        item.id === wordItem.id ? updatedItem : item
      )
      this.emit('item-updated', { type: 'item-updated', item: updatedItem })
    } else {
      // 새 아이템 추가 (최대 개수 확인)
      if (this.store.items.length >= this.store.maxItems) {
        // 가장 오래된 아이템 제거
        const sortedItems = sortWrongAnswerItems(this.store.items, 'lastWrongAt', 'asc')
        const removedItem = sortedItems[0]
        this.store.items = sortedItems.slice(1)
        this.emit('item-removed', { type: 'item-removed', item: removedItem })
      }

      updatedItem = newItem
      this.store.items.push(updatedItem)
      this.emit('item-added', { type: 'item-added', item: updatedItem })
    }

    this.saveToStorage()
    return updatedItem
  }

  /**
   * 여러 오답 아이템 배치 추가
   */
  recordWrongAnswers(wordItems: Array<{
    id: string
    word: string
    meaning: string
    difficulty: 'easy' | 'medium' | 'hard'
    category?: string
  }>): WrongAnswerItem[] {
    const newItems = wordItems.map(item => createWrongAnswerItem(item))
    const mergedItems = mergeWrongAnswerItems(this.store.items, newItems)

    // 최대 개수 제한 적용
    if (mergedItems.length > this.store.maxItems) {
      const sortedItems = sortWrongAnswerItems(mergedItems, 'lastWrongAt', 'asc')
      this.store.items = sortedItems.slice(-this.store.maxItems)
    } else {
      this.store.items = mergedItems
    }

    this.saveToStorage()
    this.emit('item-updated', { 
      type: 'item-updated', 
      items: this.store.items 
    })

    return this.store.items
  }

  /**
   * 오답 아이템 마스터 표시
   */
  markAsMastered(itemId: string): WrongAnswerItem | null {
    const itemIndex = this.store.items.findIndex(item => item.id === itemId)
    if (itemIndex === -1) return null

    const updatedItem = markWrongAnswerAsMastered(this.store.items[itemIndex])
    this.store.items[itemIndex] = updatedItem

    this.saveToStorage()
    this.emit('item-mastered', { type: 'item-mastered', item: updatedItem })

    return updatedItem
  }

  /**
   * 오답 아이템 삭제
   */
  removeItem(itemId: string): boolean {
    const itemIndex = this.store.items.findIndex(item => item.id === itemId)
    if (itemIndex === -1) return false

    const removedItem = this.store.items[itemIndex]
    this.store.items.splice(itemIndex, 1)

    this.saveToStorage()
    this.emit('item-removed', { type: 'item-removed', item: removedItem })

    return true
  }

  /**
   * 모든 오답 아이템 삭제
   */
  clearAll(): void {
    const removedItems = [...this.store.items]
    this.store.items = []
    this.store.lastUpdated = new Date().toISOString()

    this.saveToStorage()
    this.emit('store-cleared', { 
      type: 'store-cleared', 
      items: removedItems 
    })
  }

  /**
   * 오답 아이템 조회
   */
  getItem(itemId: string): WrongAnswerItem | null {
    return this.store.items.find(item => item.id === itemId) || null
  }

  /**
   * 모든 오답 아이템 조회
   */
  getAllItems(): WrongAnswerItem[] {
    return [...this.store.items]
  }

  /**
   * 필터링된 오답 아이템 조회
   */
  getFilteredItems(filters: {
    search?: string
    difficulty?: 'easy' | 'medium' | 'hard'
    mastered?: boolean
    category?: string
  }): WrongAnswerItem[] {
    return filterWrongAnswerItems(this.store.items, filters)
  }

  /**
   * 정렬된 오답 아이템 조회
   */
  getSortedItems(
    sortBy: 'lastWrongAt' | 'wrongCount' | 'word' | 'createdAt' = 'lastWrongAt',
    order: 'asc' | 'desc' = 'desc'
  ): WrongAnswerItem[] {
    return sortWrongAnswerItems(this.store.items, sortBy, order)
  }

  /**
   * 마스터되지 않은 오답 아이템 조회
   */
  getUnmasteredItems(): WrongAnswerItem[] {
    return this.store.items.filter(item => !item.masteredAt)
  }

  /**
   * 마스터된 오답 아이템 조회
   */
  getMasteredItems(): WrongAnswerItem[] {
    return this.store.items.filter(item => !!item.masteredAt)
  }

  /**
   * 통계 정보 조회
   */
  getStats(): {
    total: number
    unmastered: number
    mastered: number
    totalWrongCount: number
    averageWrongCount: number
  } {
    const total = this.store.items.length
    const unmastered = this.getUnmasteredItems().length
    const mastered = this.getMasteredItems().length
    const totalWrongCount = this.store.items.reduce((sum, item) => sum + item.wrongCount, 0)
    const averageWrongCount = total > 0 ? totalWrongCount / total : 0

    return {
      total,
      unmastered,
      mastered,
      totalWrongCount,
      averageWrongCount
    }
  }

  /**
   * 저장소 상태 조회
   */
  getStore(): WrongAnswerStore {
    return { ...this.store }
  }

  /**
   * 초기화 상태 확인
   */
  isReady(): boolean {
    return this.isInitialized
  }

  /**
   * 저장소 검증
   */
  validate(): { isValid: boolean; errors: string[] } {
    return validateWrongAnswerStore(this.store)
  }
}

// 싱글톤 인스턴스
export const wrongAnswerService = new WrongAnswerService()

/**
 * React 훅으로 오답 서비스 사용
 */
export function useWrongAnswers() {
  const { value: store, setValue, isLoading, error } = useLocalStorage({
    key: WRONG_ANSWERS_STORAGE_KEY,
    defaultValue: DEFAULT_WRONG_ANSWER_STORE
  })

  // 서비스와 동기화
  React.useEffect(() => {
    if (!isLoading && store) {
      wrongAnswerService.store = store
    }
  }, [store, isLoading])

  const recordWrongAnswer = React.useCallback((wordItem: {
    id: string
    word: string
    meaning: string
    difficulty: 'easy' | 'medium' | 'hard'
    category?: string
  }) => {
    const result = wrongAnswerService.recordWrongAnswer(wordItem)
    setValue(wrongAnswerService.getStore())
    return result
  }, [setValue])

  const markAsMastered = React.useCallback((itemId: string) => {
    const result = wrongAnswerService.markAsMastered(itemId)
    setValue(wrongAnswerService.getStore())
    return result
  }, [setValue])

  const removeItem = React.useCallback((itemId: string) => {
    const result = wrongAnswerService.removeItem(itemId)
    setValue(wrongAnswerService.getStore())
    return result
  }, [setValue])

  const clearAll = React.useCallback(() => {
    wrongAnswerService.clearAll()
    setValue(wrongAnswerService.getStore())
  }, [setValue])

  return {
    items: store.items,
    stats: wrongAnswerService.getStats(),
    recordWrongAnswer,
    markAsMastered,
    removeItem,
    clearAll,
    getFilteredItems: wrongAnswerService.getFilteredItems.bind(wrongAnswerService),
    getSortedItems: wrongAnswerService.getSortedItems.bind(wrongAnswerService),
    isLoading,
    error
  }
}
