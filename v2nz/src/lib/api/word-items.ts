import { supabase } from '@/lib/supabase'

export interface WordItem {
  id: string
  word: string
  meaning: string
  difficulty: 'easy' | 'medium' | 'hard'
  category: string | null
  tags: string[] | null
  example_sentence: string | null
  created_by: string | null
  is_approved: boolean
  usage_count: number
  created_at: string
  updated_at: string
}

export interface WordItemsParams {
  difficulty?: 'easy' | 'medium' | 'hard'
  category?: string
  limit?: number
  approved?: boolean
}

export async function getWordItems(params: WordItemsParams = {}): Promise<WordItem[]> {
  let query = supabase
    .from('word_items')
    .select('*')
    .order('usage_count', { ascending: false })

  if (params.difficulty) {
    query = query.eq('difficulty', params.difficulty)
  }

  if (params.category) {
    query = query.eq('category', params.category)
  }

  if (params.approved !== undefined) {
    query = query.eq('is_approved', params.approved)
  }

  if (params.limit) {
    query = query.limit(params.limit)
  }

  const { data, error } = await query

  if (error) {
    throw new Error(`Failed to fetch word items: ${error.message}`)
  }

  return data || []
}

export async function getRandomWordItems(count: number = 10, params: WordItemsParams = {}): Promise<WordItem[]> {
  // Get all word items first, then shuffle and take the required count
  const allItems = await getWordItems(params)
  
  // Fisher-Yates shuffle algorithm
  const shuffled = [...allItems]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  return shuffled.slice(0, count)
}

export async function getWordItemById(id: string): Promise<WordItem | null> {
  const { data, error } = await supabase
    .from('word_items')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null // Not found
    }
    throw new Error(`Failed to fetch word item: ${error.message}`)
  }

  return data
}

export async function incrementWordUsage(id: string): Promise<void> {
  const { error } = await supabase
    .from('word_items')
    .update({ usage_count: supabase.rpc('increment') })
    .eq('id', id)

  if (error) {
    throw new Error(`Failed to increment word usage: ${error.message}`)
  }
}
