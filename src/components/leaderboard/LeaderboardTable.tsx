import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Trophy, TrendingUp, Target, Loader2, AlertCircle } from 'lucide-react'
import { LeaderboardEntry } from '@/hooks/useLeaderboardQuery'
import { PercentileChip } from './PercentileChip'
import { cn } from '@/lib/utils'

interface LeaderboardTableProps {
  data: LeaderboardEntry[]
  isLoading: boolean
  error: Error | null
  className?: string
}

export function LeaderboardTable({
  data,
  isLoading,
  error,
  className
}: LeaderboardTableProps) {
  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />
    if (rank <= 3) return <Trophy className="h-4 w-4 text-gray-400" />
    if (rank <= 10) return <TrendingUp className="h-4 w-4 text-blue-500" />
    return <Target className="h-4 w-4 text-muted-foreground" />
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            리더보드 로딩 중...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-6 w-6 bg-muted motion-safe:animate-pulse rounded" />
                  <div className="space-y-1">
                    <div className="h-4 w-24 bg-muted motion-safe:animate-pulse rounded" />
                    <div className="h-3 w-16 bg-muted motion-safe:animate-pulse rounded" />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-12 bg-muted motion-safe:animate-pulse rounded" />
                  <div className="h-6 w-16 bg-muted motion-safe:animate-pulse rounded" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            오류가 발생했습니다
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            리더보드를 불러오는 중 오류가 발생했습니다. 다시 시도해주세요.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>리더보드</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Target className="h-8 w-8 mr-2" />
            아직 순위 데이터가 없습니다
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>리더보드</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {/* 데스크톱 테이블 */}
          <div className="hidden md:block" role="table" aria-label="리더보드">
            <div className="grid grid-cols-12 gap-4 p-3 font-medium text-sm text-muted-foreground border-b" role="row">
              <div className="col-span-1" role="columnheader" scope="col">순위</div>
              <div className="col-span-4" role="columnheader" scope="col">사용자</div>
              <div className="col-span-2 text-right" role="columnheader" scope="col">총점</div>
              <div className="col-span-2 text-right" role="columnheader" scope="col">라운드</div>
              <div className="col-span-3 text-right" role="columnheader" scope="col">성취도</div>
            </div>
            
            {data.map((entry) => (
              <div
                key={entry.user_id}
                className={cn(
                  'grid grid-cols-12 gap-4 p-3 border-b last:border-b-0 transition-colors',
                  entry.is_viewer && 'bg-blue-50 border-blue-200'
                )}
                role="row"
                aria-label={entry.is_viewer ? `내 순위: ${entry.rank}위` : `${entry.display_name}의 순위: ${entry.rank}위`}
              >
                <div className="col-span-1 flex items-center gap-2" role="cell">
                  {getRankIcon(entry.rank)}
                  <span className="font-mono font-medium">{entry.rank}</span>
                </div>
                
                <div className="col-span-4" role="cell">
                  <div className="font-medium">{entry.display_name}</div>
                  <div className="text-sm text-muted-foreground">
                    {entry.org_name || '개인'}
                  </div>
                </div>
                
                <div className="col-span-2 text-right" role="cell">
                  <div className="font-mono font-bold">
                    {entry.total_score.toLocaleString()}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    최고 {entry.best_score.toLocaleString()}
                  </div>
                </div>
                
                <div className="col-span-2 text-right" role="cell">
                  <div className="font-medium">{entry.total_rounds}</div>
                  <div className="text-xs text-muted-foreground">
                    평균 {Math.round(entry.avg_score).toLocaleString()}
                  </div>
                </div>
                
                <div className="col-span-3 text-right" role="cell">
                  <PercentileChip
                    percentile={entry.percentile}
                    stanine={entry.stanine}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>

          {/* 모바일 카드 뷰 */}
          <div className="md:hidden space-y-3" role="list" aria-label="리더보드">
            {data.map((entry) => (
              <div
                key={entry.user_id}
                className={cn(
                  'p-4 border rounded-lg transition-colors',
                  entry.is_viewer && 'bg-blue-50 border-blue-200'
                )}
                role="listitem"
                aria-label={entry.is_viewer ? `내 순위: ${entry.rank}위` : `${entry.display_name}의 순위: ${entry.rank}위`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getRankIcon(entry.rank)}
                    <Badge variant="secondary" className="font-mono">
                      {entry.rank}위
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-lg">
                      {entry.total_score.toLocaleString()}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.total_rounds}라운드
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{entry.display_name}</div>
                    <div className="text-sm text-muted-foreground">
                      {entry.org_name || '개인'} • 최고 {entry.best_score.toLocaleString()}
                    </div>
                  </div>
                  <PercentileChip
                    percentile={entry.percentile}
                    stanine={entry.stanine}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
