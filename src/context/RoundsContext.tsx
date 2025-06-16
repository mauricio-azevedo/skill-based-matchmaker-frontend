import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { Round, UnsavedRound } from '@/types/players'

export const STORAGE_KEY_ROUNDS = 'match_rounds'

type Ctx = {
  rounds: Round[]
  addRound: (r: UnsavedRound) => void
  removeRound: (idx: number) => void
  replaceRound: (idx: number, r: Round) => void
  setGames: (roundIdx: number, matchId: string, team: 'A' | 'B', games: number | null) => void
  clear: () => void
}

const RoundsContext = createContext<Ctx | undefined>(undefined)

const calcWinner = (gA: number | null, gB: number | null) => (gA !== null && gB !== null ? (gA > gB ? 'A' : 'B') : null)

export const RoundsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [rounds, setRounds] = useState<Round[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY_ROUNDS) || '[]') as Round[]
    } catch {
      return []
    }
  })

  // persist on change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROUNDS, JSON.stringify(rounds))
  }, [rounds])

  // add a new round with next sequential number (prev[0] is the newest)
  const addRound = useCallback((r: UnsavedRound) => {
    setRounds((prev) => {
      const nextNumber = prev.length > 0 ? prev[0].roundNumber + 1 : 1
      const newRound: Round = { ...r, roundNumber: nextNumber }
      return [newRound, ...prev]
    })
  }, [])

  const removeRound = useCallback((idx: number) => {
    setRounds((prev) => {
      // Remove the specified round
      const filtered = prev.filter((_, i) => i !== idx)
      // Re-number all remaining rounds sequentially:
      return filtered.map((round, index) => ({
        ...round,
        roundNumber: filtered.length - index,
      }))
    })
  }, [])

  const replaceRound = useCallback(
    (idx: number, r: Round) => setRounds((prev) => prev.map((old, i) => (i === idx ? r : old))),
    [],
  )

  const setGames = useCallback((roundIdx: number, matchId: string, team: 'A' | 'B', games: number | null) => {
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
  }, [])

  const clear = useCallback(() => setRounds([]), [])

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
