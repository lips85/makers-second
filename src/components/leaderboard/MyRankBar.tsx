import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, Target, TrendingUp } from 'lucide-react'
import { LeaderboardEntry } from '@/hooks/useLeaderboardQuery'
import { PercentileChip } from './PercentileChip'

interface MyRankBarProps {
  myRank: LeaderboardEntry | null
  isLoading?: boolean
  className?: string
}

export function MyRankBar({ myRank, isLoading, className }: MyRankBarProps) {
  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              <div className="space-y-1">
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
                <div className="h-3 w-16 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-12 bg-muted animate-pulse rounded" />
              <div className="h-6 w-16 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!myRank) {
    return (
      <Card className={className}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center text-muted-foreground">
            <Target className="h-4 w-4 mr-2" />
            순위 정보가 없습니다
          </div>
        </CardContent>
      </Card>
    )
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />
    if (rank <= 3) return <Trophy className="h-4 w-4 text-gray-400" />
    if (rank <= 10) return <TrendingUp className="h-4 w-4 text-blue-500" />
    return <Target className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <Card className={`bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {getRankIcon(myRank.rank)}
              <Badge variant="secondary" className="font-mono">
                {myRank.rank}위
              </Badge>
            </div>
            <div>
              <div className="font-medium">{myRank.display_name}</div>
              <div className="text-sm text-muted-foreground">
                총 {myRank.total_rounds}라운드
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="font-mono font-bold text-lg">
                {myRank.total_score.toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground">
                최고 {myRank.best_score.toLocaleString()}
              </div>
            </div>
            <PercentileChip
              percentile={myRank.percentile}
              stanine={myRank.stanine}
              size="sm"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
