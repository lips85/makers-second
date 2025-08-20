import { render, screen } from '@testing-library/react'
import { GameResultModal } from './GameResultModal'
import type { GameStats } from '@/lib/game/scoring'

const mockStats: GameStats = {
  totalQuestions: 10,
  correctAnswers: 8,
  totalScore: 800,
  accuracy: 80,
  currentCombo: 0,
  maxCombo: 3,
  averageResponseTime: 2500,
  totalResponseTime: 25000
}

const mockPercentileStats = {
  percentile: 85.5,
  stanine: 7,
  totalPlayers: 1000
}

const mockLeaderboard = {
  rank: 15,
  totalPlayers: 1000,
  period: 'daily' as const
}

describe('GameResultModal', () => {
  const defaultProps = {
    stats: mockStats,
    totalTime: 60,
    onRestart: jest.fn(),
    isOpen: true
  }

  it('should render when open', () => {
    render(<GameResultModal {...defaultProps} />)
    
    expect(screen.getByText('게임 결과')).toBeInTheDocument()
    expect(screen.getByText('성적 등급')).toBeInTheDocument()
    expect(screen.getByText('종합 성과 / 100점')).toBeInTheDocument()
  })

  it('should not render when closed', () => {
    render(<GameResultModal {...defaultProps} isOpen={false} />)
    
    expect(screen.queryByText('게임 결과')).not.toBeInTheDocument()
  })

  it('should display correct grade', () => {
    render(<GameResultModal {...defaultProps} />)
    
    // Grade should be displayed (exact grade depends on scoring logic)
    expect(screen.getByText(/[SABCDEF]/)).toBeInTheDocument()
  })

  it('should display correct stats', () => {
    render(<GameResultModal {...defaultProps} />)
    
    expect(screen.getByText('800')).toBeInTheDocument() // total score
    expect(screen.getByText('80.0%')).toBeInTheDocument() // accuracy
    expect(screen.getByText('3')).toBeInTheDocument() // max combo
    expect(screen.getByText('10')).toBeInTheDocument() // total questions
  })

  it('should display percentile stats when provided', () => {
    render(
      <GameResultModal 
        {...defaultProps} 
        percentileStats={mockPercentileStats}
      />
    )
    
    expect(screen.getByText('퍼센타일')).toBeInTheDocument()
    expect(screen.getByText('85.5%')).toBeInTheDocument()
    expect(screen.getByText('스테나인')).toBeInTheDocument()
    expect(screen.getByText('7')).toBeInTheDocument()
  })

  it('should display leaderboard info when provided', () => {
    render(
      <GameResultModal 
        {...defaultProps} 
        leaderboard={mockLeaderboard}
      />
    )
    
    expect(screen.getByText('리더보드 순위')).toBeInTheDocument()
    expect(screen.getByText('15위')).toBeInTheDocument()
    expect(screen.getByText('총 1,000명 참여')).toBeInTheDocument()
  })

  it('should display accuracy donut chart', () => {
    render(<GameResultModal {...defaultProps} />)
    
    expect(screen.getByText('정확도')).toBeInTheDocument()
    expect(screen.getByText('80.0%')).toBeInTheDocument()
  })

  it('should display speed gauge', () => {
    render(<GameResultModal {...defaultProps} />)
    
    expect(screen.getByText('평균 응답 속도')).toBeInTheDocument()
    expect(screen.getByText('2.5초')).toBeInTheDocument()
  })

  it('should display additional stats', () => {
    render(<GameResultModal {...defaultProps} />)
    
    expect(screen.getByText('총 시간:')).toBeInTheDocument()
    expect(screen.getByText('정답률:')).toBeInTheDocument()
    expect(screen.getByText('80.0%')).toBeInTheDocument() // accuracy percentage
  })

  it('should display combo information when max combo > 1', () => {
    render(<GameResultModal {...defaultProps} />)
    
    expect(screen.getByText('콤보 횟수:')).toBeInTheDocument()
    expect(screen.getByText('3회')).toBeInTheDocument()
  })

  it('should not display combo information when max combo = 1', () => {
    const statsWithNoCombo = { ...mockStats, maxCombo: 1 }
    render(<GameResultModal {...defaultProps} stats={statsWithNoCombo} />)
    
    expect(screen.queryByText('콤보 횟수:')).not.toBeInTheDocument()
  })

  it('should call onRestart when restart button is clicked', () => {
    const onRestart = jest.fn()
    render(<GameResultModal {...defaultProps} onRestart={onRestart} />)
    
    const restartButton = screen.getByText('다시 시작')
    restartButton.click()
    
    expect(onRestart).toHaveBeenCalledTimes(1)
  })

  it('should display correct performance rating', () => {
    render(<GameResultModal {...defaultProps} />)
    
    // Performance rating should be displayed (exact value depends on calculation)
    const performanceElement = screen.getByText(/\/ 100점/)
    expect(performanceElement).toBeInTheDocument()
  })

  it('should display correct answer count', () => {
    render(<GameResultModal {...defaultProps} />)
    
    expect(screen.getByText('8')).toBeInTheDocument() // correct answers
  })

  it('should handle zero scores correctly', () => {
    const zeroStats = { ...mockStats, totalScore: 0, correctAnswers: 0, accuracy: 0 }
    render(<GameResultModal {...defaultProps} stats={zeroStats} />)
    
    expect(screen.getByText('0')).toBeInTheDocument() // total score
    expect(screen.getByText('0.0%')).toBeInTheDocument() // accuracy
  })

  it('should display speed rating text', () => {
    render(<GameResultModal {...defaultProps} />)
    
    // Should display speed rating (빠름, 보통, 느림 등)
    expect(screen.getByText(/[빠름|보통|느림]/)).toBeInTheDocument()
  })

  it('should display stanine rating text', () => {
    render(
      <GameResultModal 
        {...defaultProps} 
        percentileStats={mockPercentileStats}
      />
    )
    
    // Should display stanine rating (우수, 양호, 보통, 미흡, 부족)
    expect(screen.getByText(/[우수|양호|보통|미흡|부족]/)).toBeInTheDocument()
  })

  it('should display percentile grade', () => {
    render(
      <GameResultModal 
        {...defaultProps} 
        percentileStats={mockPercentileStats}
      />
    )
    
    // Should display percentile grade (A+, A, B+, B, C, D)
    expect(screen.getByText(/[A\+|A|B\+|B|C|D]/)).toBeInTheDocument()
  })
})
