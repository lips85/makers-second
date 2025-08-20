import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface PercentileChipProps {
  percentile: number
  stanine: number
  size?: 'sm' | 'md' | 'lg'
  showPercentile?: boolean
  showStanine?: boolean
}

// 퍼센타일 색상 맵
const getPercentileColor = (percentile: number) => {
  if (percentile >= 90) return 'bg-green-100 text-green-800 border-green-200'
  if (percentile >= 75) return 'bg-blue-100 text-blue-800 border-blue-200'
  if (percentile >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  if (percentile >= 25) return 'bg-orange-100 text-orange-800 border-orange-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

// 스테나인 색상 맵
const getStanineColor = (stanine: number) => {
  if (stanine >= 8) return 'bg-green-100 text-green-800 border-green-200'
  if (stanine >= 6) return 'bg-blue-100 text-blue-800 border-blue-200'
  if (stanine >= 4) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
  if (stanine >= 2) return 'bg-orange-100 text-orange-800 border-orange-200'
  return 'bg-red-100 text-red-800 border-red-200'
}

// 스테나인 등급 텍스트
const getStanineText = (stanine: number) => {
  if (stanine >= 8) return '우수'
  if (stanine >= 6) return '양호'
  if (stanine >= 4) return '보통'
  if (stanine >= 2) return '미흡'
  return '부족'
}

export function PercentileChip({
  percentile,
  stanine,
  size = 'md',
  showPercentile = true,
  showStanine = true
}: PercentileChipProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-2'
  }

  return (
    <div className="flex gap-1">
      {showPercentile && (
        <Badge
          variant="outline"
          className={cn(
            getPercentileColor(percentile),
            sizeClasses[size]
          )}
        >
          상위 {percentile}%
        </Badge>
      )}
      {showStanine && (
        <Badge
          variant="outline"
          className={cn(
            getStanineColor(stanine),
            sizeClasses[size]
          )}
        >
          {getStanineText(stanine)} ({stanine})
        </Badge>
      )}
    </div>
  )
}
