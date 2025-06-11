import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Round } from '../types/players'

// mesmo nome usado em MatchesTab
export const STORAGE_KEY_ROUNDS = 'match_rounds'

type Ctx = {
  rounds: Round[]
  addRound: (round: Round) => void
  markWinner: (roundIdx: number, matchId: string, winner: 'A' | 'B') => void
  clear: () => void
}

const RoundsContext = createContext<Ctx | undefined>(undefined)

export const RoundsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rounds, setRounds] = useState<Round[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_ROUNDS) || '[]') as Round[]
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROUNDS, JSON.stringify(rounds))
  }, [rounds])

  const addRound = (round: Round) => setRounds((prev) => [...prev, round])

  const markWinner = (roundIdx: number, matchId: string, winner: 'A' | 'B') =>
    setRounds((prev) => {
      const copy = structuredClone(prev)
      const match = copy[roundIdx]?.matches.find((m) => m.id === matchId)
      if (match) match.winner = winner
      return copy
    })

  const clear = () => setRounds([])

  return <RoundsContext.Provider value={{ rounds, addRound, markWinner, clear }}>{children}</RoundsContext.Provider>
}

export const useRounds = () => {
  const ctx = useContext(RoundsContext)
  if (!ctx) throw new Error('useRounds must be inside RoundsProvider')
  return ctx
}
