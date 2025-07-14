import { createContext, type FC, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import type { Match, Player } from '@/types/entities'

/* ───────── helpers ───────── */
function getMinMatchCount(players: Player[]): number {
  return players.length ? players.reduce((m, p) => Math.min(m, p.matchCount), players[0].matchCount) : 0
}

/* ───────── interface do contexto ───────── */
type Ctx = {
  players: Player[]
  getById: (id: string) => Player | null
  add: (name: string, level: number, preferredPairs?: string[]) => void
  remove: (id: string) => void
  toggleActive: (id: string) => void
  updatePlayers: (fn: (p: Player[]) => Player[]) => void
  registerMatch: (match: Match) => void
  unregisterMatch: (match: Match) => void
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
      const teamA = [match.teamAPlayer1, match.teamAPlayer2]
      const teamB = [match.teamBPlayer1, match.teamBPlayer2]
      const now = new Date().toISOString()

      return prev.map((pl) => {
        const isInA = teamA.includes(pl.id)
        const isInB = teamB.includes(pl.id)
        if (!isInA && !isInB) return pl

        const mateId = isInA ? teamA.find((id) => id !== pl.id)! : teamB.find((id) => id !== pl.id)!

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

  const unregisterMatch = (match: Match) =>
    setPlayers((prev) => {
      const teamA = [match.teamAPlayer1, match.teamAPlayer2]
      const teamB = [match.teamBPlayer1, match.teamBPlayer2]
      const now = new Date().toISOString()

      return prev.map((pl) => {
        const isInA = teamA.includes(pl.id)
        const isInB = teamB.includes(pl.id)
        if (!isInA && !isInB) return pl

        const mateId = isInA ? teamA.find((id) => id !== pl.id)! : teamB.find((id) => id !== pl.id)!
        const prevCount = pl.partnerCounts[mateId] ?? 1

        return {
          ...pl,
          matchCount: pl.matchCount - 1,
          partnerCounts: {
            ...pl.partnerCounts,
            // se chegar a zero, opcionalmente remove a chave
            ...(prevCount > 1 ? { [mateId]: prevCount - 1 } : {}),
          },
          updatedAt: now,
        }
      })
    })

  // Mapa derivado para lookup rápido por ID
  const playersById = useMemo(
    () => players.reduce((acc, pl) => ({ ...acc, [pl.id]: pl }), {} as Record<string, Player>),
    [players],
  )

  return (
    <PlayersContext.Provider
      value={{
        players,
        getById: (id: string) => playersById[id] ?? null,
        add,
        remove,
        toggleActive,
        updatePlayers,
        registerMatch,
        unregisterMatch,
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
