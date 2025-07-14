import { createContext, type FC, type ReactNode, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { Match } from '@/types/entities'
import { usePlayers } from './PlayersContext'
import type { CreateMatchPayload } from '@/types/types'

const MATCHES_KEY = 'matches'

export interface MatchesCtx {
  matches: Match[]
  getById: (id: string) => Match | null
  addMatch: (data: CreateMatchPayload) => string
  updateMatch: (matchId: string, updates: Partial<Omit<Match, 'id' | 'createdAt'>>) => void
  deleteMatch: (matchId: string) => void
  clearMatches: () => void
}

const MatchesContext = createContext<MatchesCtx | undefined>(undefined)

export const MatchesProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [matchesById, setMatchesById] = useState<Record<string, Match>>({})
  const prevRef = useRef<Record<string, Match>>({})

  const { registerMatch, unregisterMatch } = usePlayers()

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(MATCHES_KEY)
    if (stored) {
      try {
        setMatchesById(JSON.parse(stored))
      } catch (err) {
        console.error('Failed to parse stored matches:', err)
      }
    }
  }, [])

  // Persist to localStorage whenever matchesById changes
  useEffect(() => {
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matchesById))
  }, [matchesById])

  // Sync player stats when matches are completed or scores change
  useEffect(() => {
    const prev = prevRef.current
    const curr = matchesById

    Object.entries(curr).forEach(([id, m]) => {
      const old = prev[id]

      // Case 1: new match or status changed to 'completed'
      const justCompleted = m.status === 'completed' && (!old || old.status !== 'completed')
      if (justCompleted) {
        registerMatch(m)
        return
      }

      // Case 2: already completed but score changed
      const scoreChanged =
        old?.status === 'completed' && m.status === 'completed' && (old.gamesA !== m.gamesA || old.gamesB !== m.gamesB)
      if (scoreChanged) {
        unregisterMatch(old)
        registerMatch(m)
      }
    })

    prevRef.current = { ...curr }
  }, [matchesById, registerMatch, unregisterMatch])

  const addMatch = (data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    setMatchesById((prev) => ({ ...prev, [id]: { id, createdAt: now, updatedAt: now, ...data } }))
    return id
  }

  const updateMatch = (matchId: string, updates: Partial<Omit<Match, 'id' | 'createdAt'>>) => {
    setMatchesById((prev) => {
      const existing = prev[matchId]
      if (!existing) return prev
      const now = new Date().toISOString()
      return { ...prev, [matchId]: { ...existing, ...updates, updatedAt: now } }
    })
  }

  const deleteMatch = (matchId: string) => {
    setMatchesById((prev) => {
      const { [matchId]: _, ...rest } = prev
      return rest
    })
  }

  const clearMatches = () => {
    setMatchesById({})
  }

  const matches = useMemo(() => Object.values(matchesById), [matchesById])
  const getById = (id: string): Match | null => matchesById[id] ?? null

  return (
    <MatchesContext.Provider value={{ matches, getById, addMatch, updateMatch, deleteMatch, clearMatches }}>
      {children}
    </MatchesContext.Provider>
  )
}

export const useMatches = (): MatchesCtx => {
  const context = useContext(MatchesContext)
  if (!context) throw new Error('useMatches must be used within a MatchesProvider')
  return context
}
