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
      const raw = JSON.parse(localStorage.getItem('sbm_players') || '[]') as Partial<Player>[]
      // normaliza e garante createdAt/updatedAt
      return raw.map((p) => ({
        id: p.id!,
        name: p.name!,
        level: p.level!,
        active: p.active !== false,
        matchCount: p.matchCount ?? 0,
        partnerCounts: p.partnerCounts ?? {},
        preferredPairs: p.preferredPairs ?? [],
        createdAt: p.createdAt ?? new Date().toISOString(),
        updatedAt: p.updatedAt ?? new Date().toISOString(),
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
  const add = (name: string, level: number, preferredPairs: string[] = []) => {
    const now = new Date().toISOString()
    setPlayers((prev) => {
      const min = getMinMatchCount(prev.filter((pl) => pl.active))
      const newPlayer: Player = {
        id: crypto.randomUUID(),
        name,
        level,
        active: true,
        matchCount: min,
        partnerCounts: {},
        preferredPairs,
        createdAt: now,
        updatedAt: now,
      }
      return [newPlayer, ...prev]
    })
  }

  const remove = (id: string) => setPlayers((p) => p.filter((pl) => pl.id !== id))

  const toggleActive = (id: string) =>
    setPlayers((prev) => {
      const minActive = getMinMatchCount(prev.filter((p) => p.active))
      const now = new Date().toISOString()
      return prev.map((pl) => {
        if (pl.id !== id) return pl
        const willActivate = !pl.active
        return {
          ...pl,
          active: willActivate,
          // ao ativar, garante que matchCount ≥ mínimo dos ativos
          matchCount: willActivate ? Math.max(pl.matchCount, minActive) : pl.matchCount,
          updatedAt: now,
        }
      })
    })

  const updatePlayers = (fn: (p: Player[]) => Player[]) => setPlayers(fn)

  /* ───── Estatísticas de partida ───── */
  const registerMatch = (match: Match) =>
    setPlayers((prev) => {
      const teamAIds = [match.teamAPlayer1, match.teamAPlayer2]
      const teamBIds = [match.teamBPlayer1, match.teamBPlayer2]
      const now = new Date().toISOString()

      return prev.map((pl) => {
        // jogador não participou desta partida
        if (!teamAIds.includes(pl.id) && !teamBIds.includes(pl.id)) {
          return pl
        }

        const inTeamA = teamAIds.includes(pl.id)
        const mateId = inTeamA ? teamAIds.find((id) => id !== pl.id)! : teamBIds.find((id) => id !== pl.id)!

        return {
          ...pl,
          matchCount: pl.matchCount + 1,
          partnerCounts: {
            ...pl.partnerCounts,
            [mateId]: (pl.partnerCounts[mateId] ?? 0) + 1,
          },
          updatedAt: now,
        }
      })
    })

  return (
    <PlayersContext.Provider
      value={{
        players,
        add,
        remove,
        toggleActive,
        updatePlayers,
        registerMatch,
      }}
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
