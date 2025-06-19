import { useMemo } from 'react'
import type { Player } from '@/types/players'

export type SortBy = 'active' | 'name' | 'level'

export function comparePlayers(a: Player, b: Player, sortBy: SortBy) {
  if (sortBy === 'name') {
    const nameCompare = a.name.localeCompare(b.name)
    return nameCompare !== 0 ? nameCompare : b.level - a.level
  }
  if (sortBy === 'level') {
    const levelCompare = b.level - a.level
    return levelCompare !== 0 ? levelCompare : a.name.localeCompare(b.name)
  }
  // active: sort active first, then name
  if (a.active !== b.active) return a.active ? -1 : 1
  return a.name.localeCompare(b.name)
}

export function usePlayerSort(players: Player[], sortBy: SortBy) {
  // For really big lists, use something like memoize-one or lodash.memoize
  return useMemo(() => [...players].sort((a, b) => comparePlayers(a, b, sortBy)), [players, sortBy])
}
