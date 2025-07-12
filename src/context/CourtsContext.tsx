import { createContext, type FC, type ReactNode, useContext, useEffect, useMemo, useState } from 'react'
import type { Court } from '@/types/types'

const COURTS_KEY = 'courts'

interface CourtsCtx {
  /** Lista de todas as quadras */
  courts: Court[]
  addCourt: () => string
  updateCourt: (courtId: string, updates: Partial<Omit<Court, 'id' | 'createdAt'>>) => void
  deleteCourt: (courtId: string) => void
}

const CourtsContext = createContext<CourtsCtx | undefined>(undefined)

export const CourtsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [courtsById, setCourtsById] = useState<Record<string, Court>>({})

  // Carrega as quadras do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(COURTS_KEY)
    if (stored) {
      try {
        setCourtsById(JSON.parse(stored))
      } catch (err) {
        console.error('Erro ao ler quadras do localStorage:', err)
      }
    }
  }, [])

  // Persiste no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem(COURTS_KEY, JSON.stringify(courtsById))
  }, [courtsById])

  const addCourt = (): string => {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()
    const newCourt: Court = { id, createdAt: now, updatedAt: now }
    setCourtsById((prev) => ({ ...prev, [id]: newCourt }))
    return id
  }

  const updateCourt = (courtId: string, updates: Partial<Omit<Court, 'id' | 'createdAt'>>) => {
    setCourtsById((prev) => {
      const existing = prev[courtId]
      if (!existing) return prev
      const now = new Date().toISOString()
      return {
        ...prev,
        [courtId]: { ...existing, ...updates, updatedAt: now },
      }
    })
  }

  const deleteCourt = (courtId: string) => {
    setCourtsById((prev) => {
      if (!(courtId in prev)) return prev
      const { [courtId]: _, ...rest } = prev
      return rest
    })
  }

  // Array derivado para consumo em componentes
  const courts = useMemo(() => Object.values(courtsById), [courtsById])

  return (
    <CourtsContext.Provider value={{ courts, addCourt, updateCourt, deleteCourt }}>{children}</CourtsContext.Provider>
  )
}

export const useCourts = (): CourtsCtx => {
  const context = useContext(CourtsContext)
  if (!context) throw new Error('useCourts must be used within a CourtsProvider')
  return context
}
