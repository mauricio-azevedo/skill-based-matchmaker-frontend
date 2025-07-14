import type { Match } from '@/types/entities'

export type CreateMatchPayload = Omit<Match, 'id' | 'createdAt' | 'updatedAt'>
