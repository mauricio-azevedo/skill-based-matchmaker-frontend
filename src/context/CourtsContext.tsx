import { createContext, type FC, type ReactNode, useContext, useEffect, useState } from 'react'
import type { Court } from '@/types/entities'
import { useMatches } from './MatchesContext'

interface CourtsCtx {
  /** Número de quadras (1–6) */
  courts: number
  /** Ajusta o número de quadras; adiciona ou remove entidades internamente */
  setCourts: (count: number) => void
  /** Remove as quadras selecionadas e apaga as partidas associadas, depois ajusta ao número final */
  removeCourtsAndMatches: (courtIds: string[], finalCount: number) => void
  /** Apenas para uso interno: vincula/desvincula uma partida à quadra */
  updateCourt: (courtId: string, matchId?: string) => void
  /** Lista completa das entidades Court (útil para PlayTab, por exemplo) */
  courtsEntities: Court[]
}

const CourtsContext = createContext<CourtsCtx | undefined>(undefined)
const COURTS_KEY = 'courts'

export const CourtsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [courtsEntities, setCourtsEntities] = useState<Court[]>([])
  const { deleteMatch } = useMatches()

  // Carrega do localStorage ou inicializa com 1 quadra
  useEffect(() => {
    const stored = localStorage.getItem(COURTS_KEY)
    if (stored) {
      try {
        setCourtsEntities(JSON.parse(stored))
        return
      } catch {
        console.error('Erro lendo quadras do localStorage')
      }
    }
    const now = new Date().toISOString()
    setCourtsEntities([{ id: crypto.randomUUID(), createdAt: now, updatedAt: now }])
  }, [])

  // Persiste sempre que mudar
  useEffect(() => {
    localStorage.setItem(COURTS_KEY, JSON.stringify(courtsEntities))
  }, [courtsEntities])

  const setCourts = (count: number) => {
    setCourtsEntities((prev) => {
      const current = prev.length
      if (count === current) return prev
      const now = new Date().toISOString()

      if (count > current) {
        // adiciona novas quadras
        const toAdd = Array.from({ length: count - current }).map(() => ({
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        }))
        return [...prev, ...toAdd]
      } else {
        // remove quadras extras (as últimas)
        return prev.slice(0, count)
      }
    })
  }

  const removeCourtsAndMatches = (courtIds: string[], finalCount: number) => {
    // 1) apagar partidas das quadras selecionadas
    courtsEntities
      .filter((c) => courtIds.includes(c.id) && c.matchId)
      .forEach((c) => {
        if (c.matchId) deleteMatch(c.matchId)
      })

    // 2) atualizar lista de quadras: remove as selecionadas, depois ajusta ao tamanho final
    setCourtsEntities((prev) => {
      let newList = prev.filter((c) => !courtIds.includes(c.id))
      if (newList.length > finalCount) {
        newList = newList.slice(0, finalCount)
      }
      return newList.map((c) => ({ ...c, updatedAt: new Date().toISOString() }))
    })
  }

  const updateCourt = (courtId: string, matchId?: string) => {
    setCourtsEntities((prev) =>
      prev.map((c) => (c.id === courtId ? { ...c, matchId, updatedAt: new Date().toISOString() } : c)),
    )
  }

  return (
    <CourtsContext.Provider
      value={{
        courts: courtsEntities.length,
        setCourts,
        removeCourtsAndMatches,
        updateCourt,
        courtsEntities,
      }}
    >
      {children}
    </CourtsContext.Provider>
  )
}

export const useCourts = (): CourtsCtx => {
  const ctx = useContext(CourtsContext)
  if (!ctx) {
    throw new Error('useCourts deve ser usado dentro de um CourtsProvider')
  }
  return ctx
}
