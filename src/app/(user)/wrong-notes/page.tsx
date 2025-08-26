'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Trash2, 
  CheckCircle, 
  Clock, 
  BookOpen, 
  Filter,
  SortAsc,
  SortDesc,
  AlertCircle,
  Trophy
} from 'lucide-react'
import { useWrongAnswers } from '@/lib/wrong-answers/service'
import { WrongAnswerItem } from '@/lib/wrong-answers/types'

export default function WrongNotesPage() {
  const { 
    items, 
    stats, 
    markAsMastered, 
    removeItem, 
    clearAll, 
    getFilteredItems, 
    getSortedItems,
    isLoading 
  } = useWrongAnswers()

  const [searchTerm, setSearchTerm] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'lastWrongAt' | 'wrongCount' | 'word'>('lastWrongAt')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [activeTab, setActiveTab] = useState<'all' | 'unmastered' | 'mastered'>('all')

  // 필터링된 아이템들
  const filteredItems = useMemo(() => {
    let filtered = getFilteredItems({
      search: searchTerm || undefined,
      difficulty: difficultyFilter === 'all' ? undefined : difficultyFilter as 'easy' | 'medium' | 'hard',
      mastered: activeTab === 'all' ? undefined : activeTab === 'mastered'
    })

    // 정렬 적용
    filtered = getSortedItems(sortBy, sortOrder)

    return filtered
  }, [items, searchTerm, difficultyFilter, activeTab, sortBy, sortOrder, getFilteredItems, getSortedItems])

  const handleMarkAsMastered = (itemId: string) => {
    markAsMastered(itemId)
  }

  const handleRemoveItem = (itemId: string) => {
    if (confirm('이 단어를 오답 노트에서 삭제하시겠습니까?')) {
      removeItem(itemId)
    }
  }

  const handleClearAll = () => {
    if (confirm('모든 오답 노트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      clearAll()
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return '어제'
    if (diffDays < 7) return `${diffDays}일 전`
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`
    return date.toLocaleDateString('ko-KR')
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
      case 'hard': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '쉬움'
      case 'medium': return '보통'
      case 'hard': return '어려움'
      default: return difficulty
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">오답 노트를 불러오는 중...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              오답 노트
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              틀린 단어들을 복습하고 완전히 익혀보세요
            </p>
          </div>
          {stats.total > 0 && (
            <Button 
              variant="outline" 
              onClick={handleClearAll}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              모두 삭제
            </Button>
          )}
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">총 오답</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
                </div>
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">미완료</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.unmastered}</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">완료</p>
                  <p className="text-2xl font-bold text-green-600">{stats.mastered}</p>
                </div>
                <Trophy className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">평균 틀림</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.averageWrongCount.toFixed(1)}
                  </p>
                </div>
                <AlertCircle className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* 검색 */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="단어나 뜻으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* 난이도 필터 */}
            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="난이도" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 난이도</SelectItem>
                <SelectItem value="easy">쉬움</SelectItem>
                <SelectItem value="medium">보통</SelectItem>
                <SelectItem value="hard">어려움</SelectItem>
              </SelectContent>
            </Select>

            {/* 정렬 */}
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lastWrongAt">최근 틀림</SelectItem>
                <SelectItem value="wrongCount">틀린 횟수</SelectItem>
                <SelectItem value="word">단어순</SelectItem>
              </SelectContent>
            </Select>

            {/* 정렬 순서 */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 탭 */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">전체 ({stats.total})</TabsTrigger>
          <TabsTrigger value="unmastered">미완료 ({stats.unmastered})</TabsTrigger>
          <TabsTrigger value="mastered">완료 ({stats.mastered})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredItems.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {searchTerm || difficultyFilter !== 'all' 
                    ? '검색 결과가 없습니다' 
                    : '오답 노트가 비어있습니다'
                  }
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchTerm || difficultyFilter !== 'all'
                    ? '다른 검색어나 필터를 시도해보세요'
                    : '퀴즈를 풀면서 틀린 단어들이 여기에 기록됩니다'
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <WrongAnswerCard
                  key={item.id}
                  item={item}
                  onMarkAsMastered={handleMarkAsMastered}
                  onRemove={handleRemoveItem}
                  formatDate={formatDate}
                  getDifficultyColor={getDifficultyColor}
                  getDifficultyText={getDifficultyText}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface WrongAnswerCardProps {
  item: WrongAnswerItem
  onMarkAsMastered: (itemId: string) => void
  onRemove: (itemId: string) => void
  formatDate: (dateString: string) => string
  getDifficultyColor: (difficulty: string) => string
  getDifficultyText: (difficulty: string) => string
}

function WrongAnswerCard({
  item,
  onMarkAsMastered,
  onRemove,
  formatDate,
  getDifficultyColor,
  getDifficultyText
}: WrongAnswerCardProps) {
  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${
      item.masteredAt ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {item.word}
              </h3>
              <Badge className={getDifficultyColor(item.difficulty)}>
                {getDifficultyText(item.difficulty)}
              </Badge>
              {item.masteredAt && (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  완료
                </Badge>
              )}
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-3">
              {item.meaning}
            </p>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                <span>{item.wrongCount}회 틀림</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{formatDate(item.lastWrongAt)}</span>
              </div>
              {item.category && (
                <Badge variant="outline" className="text-xs">
                  {item.category}
                </Badge>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {!item.masteredAt && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onMarkAsMastered(item.id)}
                className="text-green-600 hover:text-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                완료
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onRemove(item.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
