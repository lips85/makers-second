import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Globe, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ScopeToggleProps {
  scope: 'global' | 'school'
  onScopeChange: (scope: 'global' | 'school') => void
  disabled?: boolean
  className?: string
}

export function ScopeToggle({
  scope,
  onScopeChange,
  disabled = false,
  className
}: ScopeToggleProps) {
  return (
    <div className={cn('flex rounded-lg border bg-background p-1', className)}>
      <Button
        variant={scope === 'global' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onScopeChange('global')}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 transition-all',
          scope === 'global' && 'shadow-sm'
        )}
        aria-label="전체 리더보드 보기"
      >
        <Globe className="h-4 w-4" />
        <span className="hidden sm:inline">전체</span>
        <Badge variant="secondary" className="ml-1">
          글로벌
        </Badge>
      </Button>
      
      <Button
        variant={scope === 'school' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => {
          console.log('학교 버튼 클릭됨, 현재 scope:', scope)
          onScopeChange('school')
        }}
        disabled={disabled}
        className={cn(
          'flex items-center gap-2 transition-all',
          scope === 'school' && 'shadow-sm'
        )}
        aria-label="학교 리더보드 보기"
      >
        <Building2 className="h-4 w-4" />
        <span className="hidden sm:inline">학교</span>
        <Badge variant="secondary" className="ml-1">
          학교
        </Badge>
      </Button>
    </div>
  )
}
