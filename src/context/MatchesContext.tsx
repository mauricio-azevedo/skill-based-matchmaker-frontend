import { createContext, type FC, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import type { Match } from '@/types/types'

const MATCHES_KEY = 'matches'

interface MatchesCtx {
  /** Lista de todas as partidas */
  matches: Match[]
  /** Obtém uma partida pelo ID */
  getById: (id: string) => Match | undefined
  /** Adiciona uma nova partida e retorna o ID gerado */
  addMatch: (data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>) => string
  /** Atualiza uma partida existente */
  updateMatch: (matchId: string, updates: Partial<Omit<Match, 'id' | 'createdAt'>>) => void
  /** Remove uma partida pelo ID */
  deleteMatch: (matchId: string) => void
}

const MatchesContext = createContext<MatchesCtx | undefined>(undefined)

export const MatchesProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [matchesById, setMatchesById] = useState<Record<string, Match>>({})

  // Carrega as partidas do localStorage
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

  // Persiste no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(MATCHES_KEY, JSON.stringify(matchesById))
  }, [matchesById])

  /** Adiciona uma nova partida */
  const addMatch = (data: Omit<Match, 'id' | 'createdAt' | 'updatedAt'>): string => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    setMatchesById((prev) => ({
      ...prev,
      [id]: { id, createdAt: now, updatedAt: now, ...data },
    }))
    return id
  }

  /** Atualiza uma partida existente */
  const updateMatch = (matchId: string, updates: Partial<Omit<Match, 'id' | 'createdAt'>>) => {
    setMatchesById((prev) => {
      const existing = prev[matchId]
      if (!existing) return prev
      const now = new Date().toISOString()
      return {
        ...prev,
        [matchId]: { ...existing, ...updates, updatedAt: now },
      }
    })
  }

  /** Remove uma partida */
  const deleteMatch = (matchId: string) => {
    setMatchesById((prev) => {
      if (!(matchId in prev)) return prev
      const { [matchId]: _, ...rest } = prev
      return rest
    })
  }

  // Mapa derivado para consumo em componentes
  const matches = useMemo(() => Object.values(matchesById), [matchesById])

  /** Retorna uma partida pelo ID */
  const getById = (id: string): Match | undefined => matchesById[id]

  return (
    <MatchesContext.Provider value={{ matches, getById, addMatch, updateMatch, deleteMatch }}>
      {children}
    </MatchesContext.Provider>
  )
}

/** Hook para consumir o contexto de partidas */
export const useMatches = (): MatchesCtx => {
  const context = useContext(MatchesContext)
  if (!context) throw new Error('useMatches must be used within a MatchesProvider')
  return context
}
