import React, { createContext, useContext, useEffect, useState } from 'react'

export interface Player {
  id: string
  name: string
  level: number // 1..N
  matches: number
}

type Ctx = {
  players: Player[]
  add: (name: string, level: number) => void
  remove: (id: string) => void
  incrementMatches: (ids: string[]) => void
  resetMatches: () => void
}

const PlayersContext = createContext<Ctx | undefined>(undefined)

export const PlayersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>([])

  // ---- localStorage persistence ------------------------------------------
  useEffect(() => {
    const raw = localStorage.getItem('sbm_players')
    if (raw) {
      const parsed: Player[] = JSON.parse(raw)
      setPlayers(parsed.map((p) => ({ matches: 0, ...p })))
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('sbm_players', JSON.stringify(players))
  }, [players])

  const add = (name: string, level: number) =>
    setPlayers((p) => [...p, { id: crypto.randomUUID(), name, level, matches: 0 }])
  const remove = (id: string) => setPlayers((p) => p.filter((pl) => pl.id !== id))
  const incrementMatches = (ids: string[]) =>
    setPlayers((p) =>
      p.map((pl) =>
        ids.includes(pl.id) ? { ...pl, matches: pl.matches + 1 } : pl
      )
    )
  const resetMatches = () =>
    setPlayers((p) => p.map((pl) => ({ ...pl, matches: 0 })))

  return (
    <PlayersContext.Provider
      value={{ players, add, remove, incrementMatches, resetMatches }}
    >
      {children}
    </PlayersContext.Provider>
  )
}

export const usePlayers = () => {
  const ctx = useContext(PlayersContext)
  if (!ctx) throw new Error('usePlayers must be inside PlayersProvider')
  return ctx
}
