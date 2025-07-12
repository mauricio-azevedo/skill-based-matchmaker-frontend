import { createContext, type FC, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import type { Match } from '@/types/types'

const MATCHES_KEY = 'matches'

interface MatchesCtx {
  matches: Match[]
  getById: (id: string) => Match | undefined
  addMatch: (data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateMatch: (matchId: string, updates: Partial<Omit<Match, 'id' | 'createdAt'>>) => void
  deleteMatch: (matchId: string) => void
  clearMatches: () => void
}

const MatchesContext = createContext<MatchesCtx | undefined>(undefined)

export const MatchesProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [matchesById, setMatchesById] = useState<Record<string, Match>>({})

  useEffect(() => {
    const stored = localStorage.getItem(MATCHES_KEY)
    if (stored) {
      try {
        setMatchesById(JSON.parse(stored))
      } catch (err) {
        console.error('Erro ao ler partidas do localStorage:', err)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matchesById))
  }, [matchesById])

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
      if (!(matchId in prev)) return prev
      const { [matchId]: _, ...rest } = prev
      return rest
    })
  }

  const clearMatches = () => {
    setMatchesById({})
  }

  const matches = useMemo(() => Object.values(matchesById), [matchesById])
  const getById = (id: string): Match | undefined => matchesById[id]

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
