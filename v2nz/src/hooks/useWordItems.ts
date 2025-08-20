import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getWordItems, getRandomWordItems, getWordItemById, incrementWordUsage, type WordItemsParams, type WordItem } from '@/lib/api/word-items'

// Query keys
export const wordItemsKeys = {
  all: ['wordItems'] as const,
  lists: () => [...wordItemsKeys.all, 'list'] as const,
  list: (params: WordItemsParams) => [...wordItemsKeys.lists(), params] as const,
  random: (count: number, params: WordItemsParams) => [...wordItemsKeys.all, 'random', count, params] as const,
  details: () => [...wordItemsKeys.all, 'detail'] as const,
  detail: (id: string) => [...wordItemsKeys.details(), id] as const,
}

// Get word items with parameters
export function useWordItems(params: WordItemsParams = {}) {
  return useQuery({
    queryKey: wordItemsKeys.list(params),
    queryFn: () => getWordItems(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Get random word items for a round
export function useRandomWordItems(count: number = 10, params: WordItemsParams = {}) {
  return useQuery({
    queryKey: wordItemsKeys.random(count, params),
    queryFn: () => getRandomWordItems(count, params),
    staleTime: 0, // Always fresh for random items
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

// Get a specific word item by ID
export function useWordItem(id: string) {
  return useQuery({
    queryKey: wordItemsKeys.detail(id),
    queryFn: () => getWordItemById(id),
    enabled: !!id,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  })
}

// Increment word usage mutation
export function useIncrementWordUsage() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: incrementWordUsage,
    onSuccess: (_, wordId) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: wordItemsKeys.all })
      
      // Update the specific word item in cache if it exists
      queryClient.setQueryData(
        wordItemsKeys.detail(wordId),
        (oldData: WordItem | null) => {
          if (oldData) {
            return { ...oldData, usage_count: oldData.usage_count + 1 }
          }
          return oldData
        }
      )
    },
  })
}

// Prefetch word items for better UX
export function usePrefetchWordItems(params: WordItemsParams = {}) {
  const queryClient = useQueryClient()
  
  return () => {
    queryClient.prefetchQuery({
      queryKey: wordItemsKeys.list(params),
      queryFn: () => getWordItems(params),
      staleTime: 5 * 60 * 1000,
    })
  }
}
