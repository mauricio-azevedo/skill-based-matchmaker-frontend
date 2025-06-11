// ============================================================================
// src/context/PlayersContext.tsx – Estado global de jogadores
// ============================================================================
import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Player } from '../types/players'

// API pública exposta pelo contexto: lista + operações CRUD minimais.
type Ctx = {
  players: Player[]
  add: (name: string, level: number) => void
  remove: (id: string) => void
  toggleActive: (id: string) => void

  /** Permite atualizar a lista de players para incrementar estatísticas */
  updatePlayers: (updater: (players: Player[]) => Player[]) => void
}

// Contexto criado com valor undefined para forçar hook guard.
const PlayersContext = createContext<Ctx | undefined>(undefined)

// ---------------------------------------------------------------------------
// Provider que cerca a aplicação.  Persiste jogadores em localStorage para que
// o usuário não perca dados ao recarregar a página.
// ---------------------------------------------------------------------------
export const PlayersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sbm_players') || '[]') as Player[]
      return stored.map((p) => ({
        ...p,
        active: p.active !== false,
        matchCount: p.matchCount ?? 0,
        partnerCounts: p.partnerCounts ?? {},
      }))
    } catch {
      return []
    }
  })

  useEffect(() => {
    localStorage.setItem('sbm_players', JSON.stringify(players))
  }, [players])

  const add = (name: string, level: number) =>
    setPlayers((p) => [...p, { id: crypto.randomUUID(), name, level, active: true, matchCount: 0, partnerCounts: {} }])

  const remove = (id: string) => setPlayers((p) => p.filter((pl) => pl.id !== id))
  const toggleActive = (id: string) =>
    setPlayers((p) => p.map((pl) => (pl.id === id ? { ...pl, active: !pl.active } : pl)))

  const updatePlayers = (updater: (players: Player[]) => Player[]) => setPlayers(updater)

  return (
    <PlayersContext.Provider value={{ players, add, remove, toggleActive, updatePlayers }}>
      {children}
    </PlayersContext.Provider>
  )
}

// Hook auxiliar: garante que o código consumidor esteja dentro do Provider.
export const usePlayers = () => {
  const ctx = useContext(PlayersContext)
  if (!ctx) throw new Error('usePlayers must be inside PlayersProvider')
  return ctx
}
