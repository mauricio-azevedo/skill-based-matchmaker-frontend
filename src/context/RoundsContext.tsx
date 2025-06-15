// context/RoundsContext.tsx
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import * as React from 'react'
import type { Round } from '@/types/players'

export const STORAGE_KEY_ROUNDS = 'match_rounds'

type Ctx = {
  rounds: Round[] // já vem invertido
  addRound: (r: Round) => void
  removeRound: (idx: number) => void //  🔹 novo
  replaceRound: (idx: number, r: Round) => void //  🔹 novo
  setGames: (roundIdx: number, matchId: string, team: 'A' | 'B', games: number | null) => void
  clear: () => void
}

const RoundsContext = createContext<Ctx | undefined>(undefined)

const calcWinner = (gA: number | null, gB: number | null) => (gA !== null && gB !== null ? (gA > gB ? 'A' : 'B') : null)

export const RoundsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roundsAsc, setRoundsAsc] = useState<Round[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_ROUNDS) || '[]') as Round[]
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROUNDS, JSON.stringify(roundsAsc))
  }, [roundsAsc])

  const addRound = (r: Round) => setRoundsAsc((prev) => [...prev, r])

  const removeRound = (idx: number) => setRoundsAsc((prev) => prev.filter((_, i) => i !== idx))

  const replaceRound = (idx: number, r: Round) => setRoundsAsc((prev) => prev.map((old, i) => (i === idx ? r : old)))

  const setGames = (roundIdx: number, matchId: string, team: 'A' | 'B', games: number | null) =>
    setRoundsAsc((prev) => {
      const copy = structuredClone(prev)
      const match = copy[roundIdx]?.matches.find((m) => m.id === matchId)
      if (match) {
        if (team === 'A') match.gamesA = games
        else match.gamesB = games
        match.winner = calcWinner(match.gamesA, match.gamesB)
      }
      return copy
    })

  const clear = () => setRoundsAsc([])

  // entrega invertido ao consumer
  const rounds = useMemo(() => [...roundsAsc].reverse(), [roundsAsc])

  return (
    <RoundsContext.Provider value={{ rounds, addRound, removeRound, replaceRound, setGames, clear }}>
      {children}
    </RoundsContext.Provider>
  )
}

export const useRounds = () => {
  const ctx = useContext(RoundsContext)
  if (!ctx) throw new Error('useRounds must be inside RoundsProvider')
  return ctx
}
