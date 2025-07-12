// ============================================================================
// src/context/PlayersContext.tsx – Estado global de jogadores + estatísticas
// ============================================================================
import { createContext, type FC, type ReactNode, useContext, useEffect, useState } from 'react'
import type { Match, Player } from '@/types/types'

/* ───────── helpers ───────── */
function getMinMatchCount(players: Player[]): number {
  return players.length ? players.reduce((m, p) => Math.min(m, p.matchCount), players[0].matchCount) : 0
}

/* ───────── interface do contexto ───────── */
type Ctx = {
  players: Player[]
  add: (name: string, level: number, preferredPairs?: string[]) => void
  remove: (id: string) => void
  toggleActive: (id: string) => void
  updatePlayers: (fn: (p: Player[]) => Player[]) => void
  /** Registra estatísticas de uma partida recém-finalizada */
  registerMatch: (match: Match) => void
}

const PlayersContext = createContext<Ctx | undefined>(undefined)

/* ───────── Provider ───────── */
export const PlayersProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('sbm_players') || '[]') as Player[]
      return raw.map((p) => ({
        ...p,
        active: p.active !== false,
        matchCount: p.matchCount ?? 0,
        partnerCounts: p.partnerCounts ?? {},
        preferredPairs: p.preferredPairs ?? [],
      }))
    } catch {
      return []
    }
  })

  /* persistência */
  useEffect(() => {
    localStorage.setItem('sbm_players', JSON.stringify(players))
  }, [players])

  /* ───── CRUD ───── */
  const add = (name: string, level: number, preferredPairs: string[] = []) =>
    setPlayers((prev) => {
      const min = getMinMatchCount(prev.filter((pl) => pl.active))
      return [
        {
          id: crypto.randomUUID(),
          name,
          level,
          active: true,
          matchCount: min,
          partnerCounts: {},
          preferredPairs,
        },
        ...prev,
      ]
    })

  const remove = (id: string) => setPlayers((p) => p.filter((pl) => pl.id !== id))

  const toggleActive = (id: string) =>
    setPlayers((prev) =>
      prev.map((pl) => {
        if (pl.id !== id) return pl
        const willActivate = !pl.active
        const minActive = getMinMatchCount(prev.filter((p) => p.active))
        return {
          ...pl,
          active: willActivate,
          matchCount: willActivate ? Math.max(pl.matchCount, minActive) : pl.matchCount,
        }
      }),
    )

  const updatePlayers = (fn: (p: Player[]) => Player[]) => setPlayers(fn)

  /* ───── Estatísticas de partida ───── */
  const registerMatch = (match: Match) =>
    setPlayers((prev) =>
      prev.map((pl) => {
        if (![...match.teamA, ...match.teamB].some((m) => m.id === pl.id)) return pl

        const inTeamA = match.teamA.some((m) => m.id === pl.id)
        const mateId = inTeamA
          ? match.teamA.find((m) => m.id !== pl.id)!.id
          : match.teamB.find((m) => m.id !== pl.id)!.id

        return {
          ...pl,
          matchCount: pl.matchCount + 1,
          partnerCounts: { ...pl.partnerCounts, [mateId]: (pl.partnerCounts[mateId] ?? 0) + 1 },
        }
      }),
    )

  return (
    <PlayersContext.Provider value={{ players, add, remove, toggleActive, updatePlayers, registerMatch }}>
      {children}
    </PlayersContext.Provider>
  )
}

export const usePlayers = () => {
  const ctx = useContext(PlayersContext)
  if (!ctx) throw new Error('usePlayers must be inside PlayersProvider')
  return ctx
}
