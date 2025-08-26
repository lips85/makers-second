import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useLeaderboardQuery, useMyRankQuery } from './useLeaderboardQuery'
import { supabase } from '@/lib/supabase'

// Supabase 모킹
jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn()
  }
}))

const mockSupabase = supabase as jest.Mocked<typeof supabase>

// 테스트용 QueryClient 생성
const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
})

// 테스트용 래퍼 컴포넌트
const wrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = createTestQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useLeaderboardQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch leaderboard data successfully', async () => {
    const mockData = [
      {
        rank: 1,
        user_id: 'user1',
        display_name: 'User 1',
        username: 'user1',
        org_name: 'School A',
        total_score: 1000,
        total_rounds: 5,
        best_score: 250,
        avg_score: 200,
        percentile: 95,
        stanine: 8,
        is_viewer: false
      }
    ]

    mockSupabase.rpc.mockResolvedValueOnce({
      data: mockData,
      error: null
    })

    const { result } = renderHook(
      () => useLeaderboardQuery({
        scope: 'global',
        limit: 10,
        viewerUserId: 'viewer1'
      }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData)
    expect(result.current.error).toBeNull()
    expect(mockSupabase.rpc).toHaveBeenCalledWith('get_leaderboard', {
      scope_filter: 'global',
      org_id_filter: null,
      limit_count: 10,
      viewer_user_id: 'viewer1'
    })
  })

  it('should handle error when API call fails', async () => {
    const mockError = new Error('API Error')
    mockSupabase.rpc.mockResolvedValueOnce({
      data: null,
      error: mockError
    })

    const { result } = renderHook(
      () => useLeaderboardQuery({
        scope: 'school',
        orgId: 'org1',
        limit: 10
      }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.data).toBeUndefined()
  })

  it('should be disabled when enabled is false', () => {
    const { result } = renderHook(
      () => useLeaderboardQuery({
        scope: 'global',
        enabled: false
      }),
      { wrapper }
    )

    expect(result.current.isLoading).toBe(false)
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })
})

describe('useMyRankQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should fetch my rank data successfully', async () => {
    const mockData = [
      {
        rank: 15,
        user_id: 'viewer1',
        display_name: 'My Name',
        username: 'myname',
        org_name: 'School A',
        total_score: 800,
        total_rounds: 4,
        best_score: 220,
        avg_score: 200,
        percentile: 75,
        stanine: 6,
        is_viewer: true
      }
    ]

    mockSupabase.rpc.mockResolvedValueOnce({
      data: mockData,
      error: null
    })

    const { result } = renderHook(
      () => useMyRankQuery({
        scope: 'global',
        viewerUserId: 'viewer1'
      }),
      { wrapper }
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.data).toEqual(mockData[0])
    expect(result.current.error).toBeNull()
  })

  it('should return null when no viewer user ID is provided', () => {
    const { result } = renderHook(
      () => useMyRankQuery({
        scope: 'global',
        viewerUserId: undefined
      }),
      { wrapper }
    )

    expect(result.current.data).toBeNull()
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })

  it('should be disabled when viewer user ID is not provided', () => {
    const { result } = renderHook(
      () => useMyRankQuery({
        scope: 'global',
        viewerUserId: undefined,
        enabled: true
      }),
      { wrapper }
    )

    expect(result.current.isLoading).toBe(false)
    expect(mockSupabase.rpc).not.toHaveBeenCalled()
  })
})
