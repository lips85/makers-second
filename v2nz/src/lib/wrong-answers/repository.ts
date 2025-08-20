import { WrongAnswerItem } from './types'

// 리포지토리 인터페이스
export interface WrongAnswerRepository {
  // 기본 CRUD 작업
  getAll(userId: string): Promise<WrongAnswerItem[]>
  getById(userId: string, itemId: string): Promise<WrongAnswerItem | null>
  create(userId: string, item: Omit<WrongAnswerItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<WrongAnswerItem>
  update(userId: string, itemId: string, updates: Partial<WrongAnswerItem>): Promise<WrongAnswerItem | null>
  delete(userId: string, itemId: string): Promise<boolean>
  deleteAll(userId: string): Promise<boolean>

  // 특수 작업
  markAsMastered(userId: string, itemId: string): Promise<WrongAnswerItem | null>
  incrementWrongCount(userId: string, itemId: string): Promise<WrongAnswerItem | null>
  getStats(userId: string): Promise<{
    total: number
    unmastered: number
    mastered: number
    totalWrongCount: number
    averageWrongCount: number
  }>

  // 동기화 작업
  syncFromLocal(userId: string, localItems: WrongAnswerItem[]): Promise<{
    synced: number
    conflicts: number
    errors: number
  }>
  syncToLocal(userId: string): Promise<WrongAnswerItem[]>
}

// Supabase 어댑터 스텁 구현
export class SupabaseWrongAnswerRepository implements WrongAnswerRepository {
  private isEnabled = false

  constructor(enabled: boolean = false) {
    this.isEnabled = enabled
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled
  }

  async getAll(userId: string): Promise<WrongAnswerItem[]> {
    if (!this.isEnabled) {
      console.log('Supabase 오답 노트 동기화가 비활성화되어 있습니다')
      return []
    }

    // TODO: Supabase 구현
    console.log('Supabase 오답 노트 조회 (미구현)')
    return []
  }

  async getById(userId: string, itemId: string): Promise<WrongAnswerItem | null> {
    if (!this.isEnabled) return null

    // TODO: Supabase 구현
    console.log('Supabase 오답 노트 단일 조회 (미구현)')
    return null
  }

  async create(userId: string, item: Omit<WrongAnswerItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<WrongAnswerItem> {
    if (!this.isEnabled) {
      throw new Error('Supabase 오답 노트 동기화가 비활성화되어 있습니다')
    }

    // TODO: Supabase 구현
    console.log('Supabase 오답 노트 생성 (미구현)')
    throw new Error('미구현')
  }

  async update(userId: string, itemId: string, updates: Partial<WrongAnswerItem>): Promise<WrongAnswerItem | null> {
    if (!this.isEnabled) return null

    // TODO: Supabase 구현
    console.log('Supabase 오답 노트 업데이트 (미구현)')
    return null
  }

  async delete(userId: string, itemId: string): Promise<boolean> {
    if (!this.isEnabled) return false

    // TODO: Supabase 구현
    console.log('Supabase 오답 노트 삭제 (미구현)')
    return false
  }

  async deleteAll(userId: string): Promise<boolean> {
    if (!this.isEnabled) return false

    // TODO: Supabase 구현
    console.log('Supabase 오답 노트 전체 삭제 (미구현)')
    return false
  }

  async markAsMastered(userId: string, itemId: string): Promise<WrongAnswerItem | null> {
    if (!this.isEnabled) return null

    // TODO: Supabase 구현
    console.log('Supabase 오답 노트 마스터 표시 (미구현)')
    return null
  }

  async incrementWrongCount(userId: string, itemId: string): Promise<WrongAnswerItem | null> {
    if (!this.isEnabled) return null

    // TODO: Supabase 구현
    console.log('Supabase 오답 노트 틀린 횟수 증가 (미구현)')
    return null
  }

  async getStats(userId: string): Promise<{
    total: number
    unmastered: number
    mastered: number
    totalWrongCount: number
    averageWrongCount: number
  }> {
    if (!this.isEnabled) {
      return {
        total: 0,
        unmastered: 0,
        mastered: 0,
        totalWrongCount: 0,
        averageWrongCount: 0
      }
    }

    // TODO: Supabase 구현
    console.log('Supabase 오답 노트 통계 조회 (미구현)')
    return {
      total: 0,
      unmastered: 0,
      mastered: 0,
      totalWrongCount: 0,
      averageWrongCount: 0
    }
  }

  async syncFromLocal(userId: string, localItems: WrongAnswerItem[]): Promise<{
    synced: number
    conflicts: number
    errors: number
  }> {
    if (!this.isEnabled) {
      return { synced: 0, conflicts: 0, errors: 0 }
    }

    // TODO: Supabase 구현 - 로컬 데이터를 서버로 동기화
    console.log('Supabase 오답 노트 로컬→서버 동기화 (미구현)')
    return { synced: 0, conflicts: 0, errors: 0 }
  }

  async syncToLocal(userId: string): Promise<WrongAnswerItem[]> {
    if (!this.isEnabled) {
      return []
    }

    // TODO: Supabase 구현 - 서버 데이터를 로컬로 동기화
    console.log('Supabase 오답 노트 서버→로컬 동기화 (미구현)')
    return []
  }
}

// 싱글톤 인스턴스
export const wrongAnswerRepository = new SupabaseWrongAnswerRepository(false)

// 동기화 유틸리티 함수들
export class WrongAnswerSyncManager {
  private repository: SupabaseWrongAnswerRepository
  private maxRetries = 3
  private retryDelay = 1000 // 1초

  constructor(repository: SupabaseWrongAnswerRepository) {
    this.repository = repository
  }

  /**
   * 로그인 시 동기화 트리거
   */
  async triggerSyncOnLogin(userId: string, localItems: WrongAnswerItem[]): Promise<{
    success: boolean
    synced: number
    conflicts: number
    errors: number
  }> {
    if (!this.repository.isEnabled) {
      console.log('오답 노트 동기화가 비활성화되어 있습니다')
      return { success: true, synced: 0, conflicts: 0, errors: 0 }
    }

    try {
      const result = await this.retryOperation(
        () => this.repository.syncFromLocal(userId, localItems),
        this.maxRetries
      )

      return {
        success: true,
        synced: result.synced,
        conflicts: result.conflicts,
        errors: result.errors
      }
    } catch (error) {
      console.error('오답 노트 동기화 실패:', error)
      return {
        success: false,
        synced: 0,
        conflicts: 0,
        errors: 1
      }
    }
  }

  /**
   * 재시도 로직이 포함된 작업 실행
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries: number
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        
        if (attempt === maxRetries) {
          throw lastError
        }

        // 지수 백오프
        const delay = this.retryDelay * Math.pow(2, attempt - 1)
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }

    throw lastError!
  }

  /**
   * 병합 규칙 적용
   */
  mergeItems(localItems: WrongAnswerItem[], serverItems: WrongAnswerItem[]): {
    merged: WrongAnswerItem[]
    conflicts: Array<{
      local: WrongAnswerItem
      server: WrongAnswerItem
      reason: string
    }>
  } {
    const merged: WrongAnswerItem[] = []
    const conflicts: Array<{
      local: WrongAnswerItem
      server: WrongAnswerItem
      reason: string
    }> = []

    const localMap = new Map(localItems.map(item => [item.id, item]))
    const serverMap = new Map(serverItems.map(item => [item.id, item]))

    // 모든 고유 ID 수집
    const allIds = new Set([...localMap.keys(), ...serverMap.keys()])

    for (const id of allIds) {
      const local = localMap.get(id)
      const server = serverMap.get(id)

      if (local && server) {
        // 충돌 해결: 더 최근에 업데이트된 것을 우선
        const localUpdated = new Date(local.updatedAt)
        const serverUpdated = new Date(server.updatedAt)

        if (localUpdated > serverUpdated) {
          merged.push(local)
        } else if (serverUpdated > localUpdated) {
          merged.push(server)
        } else {
          // 동시 업데이트 - 로컬 우선
          merged.push(local)
          conflicts.push({
            local,
            server,
            reason: '동시 업데이트'
          })
        }
      } else if (local) {
        merged.push(local)
      } else if (server) {
        merged.push(server)
      }
    }

    return { merged, conflicts }
  }
}

// 싱글톤 동기화 매니저
export const wrongAnswerSyncManager = new WrongAnswerSyncManager(wrongAnswerRepository)
