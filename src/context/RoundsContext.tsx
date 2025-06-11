import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Round } from '../types/players'

// mesmo nome usado em MatchesTab
export const STORAGE_KEY_ROUNDS = 'match_rounds'

type Ctx = {
  rounds: Round[]
  addRound: (round: Round) => void
  setGames: (roundIdx: number, matchId: string, team: 'A' | 'B', games: number | null) => void
  clear: () => void
}

const RoundsContext = createContext<Ctx | undefined>(undefined)

/** Decide vencedor a partir dos games. Se ainda não tiver ambos, devolve null. */
function calcWinner(gA: number | null, gB: number | null): 'A' | 'B' | null {
  return gA !== null && gB !== null ? (gA > gB ? 'A' : 'B') : null
}

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

  const setGames = (roundIdx: number, matchId: string, team: 'A' | 'B', games: number | null) =>
    setRounds((prev) => {
      const copy = structuredClone(prev)
      const match = copy[roundIdx]?.matches.find((m) => m.id === matchId)
      if (match) {
        if (team === 'A') match.gamesA = games
        else match.gamesB = games
        match.winner = calcWinner(match.gamesA, match.gamesB)
      }
      return copy
    })

  const clear = () => setRounds([])

  return <RoundsContext.Provider value={{ rounds, addRound, setGames, clear }}>{children}</RoundsContext.Provider>
}

export const useRounds = () => {
  const ctx = useContext(RoundsContext)
  if (!ctx) throw new Error('useRounds must be inside RoundsProvider')
  return ctx
}
