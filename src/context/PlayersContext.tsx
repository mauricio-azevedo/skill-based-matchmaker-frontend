import React, { createContext, useContext, useEffect, useState } from 'react'

export interface Player {
  id: string
  name: string
  level: number // 1..N
}

type Ctx = {
  players: Player[]
  add: (name: string, level: number) => void
  remove: (id: string) => void
}

const PlayersContext = createContext<Ctx | undefined>(undefined)

export const PlayersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>([])

  // ---- localStorage persistence ------------------------------------------
  useEffect(() => {
    const raw = localStorage.getItem('sbm_players')
    if (raw) setPlayers(JSON.parse(raw))
  }, [])

  useEffect(() => {
    localStorage.setItem('sbm_players', JSON.stringify(players))
  }, [players])

  const add = (name: string, level: number) => setPlayers((p) => [...p, { id: crypto.randomUUID(), name, level }])
  const remove = (id: string) => setPlayers((p) => p.filter((pl) => pl.id !== id))

  return <PlayersContext.Provider value={{ players, add, remove }}>{children}</PlayersContext.Provider>
}

export const usePlayers = () => {
  const ctx = useContext(PlayersContext)
  if (!ctx) throw new Error('usePlayers must be inside PlayersProvider')
  return ctx
}
