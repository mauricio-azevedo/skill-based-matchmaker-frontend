import { createContext, type FC, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import type { Player } from '@/types/entities'

/* ───────── interface do contexto ───────── */
type Ctx = {
  players: Player[]
  getById: (id: string) => Player | null
  add: (name: string, level: number, preferredPairs?: string[], id?: string) => void
  remove: (id: string) => void
  toggleActive: (id: string) => void
  updatePlayers: (fn: (p: Player[]) => Player[]) => void
}

const PlayersContext = createContext<Ctx | undefined>(undefined)

/* ───────── helpers ───────── */
const lowestActiveRefCount = (list: Player[]): number => {
  const actives = list.filter((p) => p.active)
  return actives.length ? Math.min(...actives.map((p) => p.referenceMatchCount)) : 0
}

/* ───────── Provider ───────── */
export const PlayersProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem('sbm_players') || '[]') as Partial<Player>[]
      return raw.map((p) => ({
        id: p.id!,
        name: p.name!,
        level: p.level!,
        active: p.active !== false,
        preferredPairs: p.preferredPairs ?? [],
        referenceMatchCount: p.referenceMatchCount ?? 0,
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
  const add = (name: string, level: number, preferredPairs: string[] = [], id?: string) => {
    const now = new Date().toISOString()
    setPlayers((prev) => {
      const newPlayer: Player = {
        id: id ?? crypto.randomUUID(),
        name,
        level,
        active: true,
        preferredPairs,
        referenceMatchCount: lowestActiveRefCount(prev),
        createdAt: now,
        updatedAt: now,
      }
      return [newPlayer, ...prev]
    })
  }

  const remove = (id: string) => setPlayers((p) => p.filter((pl) => pl.id !== id))

  const toggleActive = (id: string) =>
    setPlayers((prev) => {
      const now = new Date().toISOString()
      const minRef = lowestActiveRefCount(prev)
      return prev.map((pl) => {
        if (pl.id !== id) return pl
        const willActivate = !pl.active
        return {
          ...pl,
          active: willActivate,
          referenceMatchCount: willActivate ? minRef : pl.referenceMatchCount,
          updatedAt: now,
        }
      })
    })

  const updatePlayers = (fn: (p: Player[]) => Player[]) => setPlayers(fn)

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
