import { render, screen } from '@testing-library/react'
import { LeaderboardTable } from './LeaderboardTable'
import { LeaderboardEntry } from '@/hooks/useLeaderboardQuery'

const mockData: LeaderboardEntry[] = [
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
  },
  {
    rank: 2,
    user_id: 'user2',
    display_name: 'User 2',
    username: 'user2',
    org_name: 'School B',
    total_score: 900,
    total_rounds: 4,
    best_score: 240,
    avg_score: 225,
    percentile: 85,
    stanine: 7,
    is_viewer: true
  }
]

describe('LeaderboardTable', () => {
  it('should render loading state', () => {
    render(
      <LeaderboardTable
        data={[]}
        isLoading={true}
        error={null}
      />
    )

    expect(screen.getByText('리더보드 로딩 중...')).toBeInTheDocument()
  })

  it('should render error state', () => {
    const error = new Error('Failed to load leaderboard')
    render(
      <LeaderboardTable
        data={[]}
        isLoading={false}
        error={error}
      />
    )

    expect(screen.getByText('오류가 발생했습니다')).toBeInTheDocument()
    expect(screen.getByText('리더보드를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.')).toBeInTheDocument()
  })

  it('should render empty state', () => {
    render(
      <LeaderboardTable
        data={[]}
        isLoading={false}
        error={null}
      />
    )

    expect(screen.getByText('아직 순위 데이터가 없습니다')).toBeInTheDocument()
  })

  it('should render leaderboard data', () => {
    render(
      <LeaderboardTable
        data={mockData}
        isLoading={false}
        error={null}
      />
    )

    expect(screen.getByText('User 1')).toBeInTheDocument()
    expect(screen.getByText('User 2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1,000')).toBeInTheDocument()
    expect(screen.getByText('900')).toBeInTheDocument()
  })

  it('should highlight viewer row', () => {
    render(
      <LeaderboardTable
        data={mockData}
        isLoading={false}
        error={null}
      />
    )

    // User 2가 viewer이므로 해당 행이 강조되어야 함
    const viewerRow = screen.getByLabelText('내 순위: 2위')
    expect(viewerRow).toBeInTheDocument()
  })

  it('should display organization names', () => {
    render(
      <LeaderboardTable
        data={mockData}
        isLoading={false}
        error={null}
      />
    )

    expect(screen.getByText('School A')).toBeInTheDocument()
    expect(screen.getByText('School B')).toBeInTheDocument()
  })

  it('should display percentile and stanine information', () => {
    render(
      <LeaderboardTable
        data={mockData}
        isLoading={false}
        error={null}
      />
    )

    // 퍼센타일과 스테나인 칩이 렌더링되어야 함
    expect(screen.getByText('상위 95%')).toBeInTheDocument()
    expect(screen.getByText('상위 85%')).toBeInTheDocument()
  })
})
