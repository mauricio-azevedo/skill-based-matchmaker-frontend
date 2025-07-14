import {
  createContext,
  type Dispatch,
  type FC,
  type ReactNode,
  type SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import type { Court } from '@/types/entities'

interface CourtsCtx {
  /** Número de quadras (1–6) */
  courts: number
  /** Setter bruto de courtsEntities (para uso em hooks que combinam lógica de quadras+partidas) */
  setCourtsEntities: Dispatch<SetStateAction<Court[]>>
  /** Apenas para uso interno: vincula/desvincula uma partida à quadra */
  updateCourt: (courtId: string, matchId?: string) => void
  /** Lista completa das entidades Court (útil para PlayTab, por exemplo) */
  courtsEntities: Court[]
}

const CourtsContext = createContext<CourtsCtx | undefined>(undefined)
const COURTS_KEY = 'courts'

export const CourtsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [courtsEntities, setCourtsEntities] = useState<Court[]>([])

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

  const updateCourt = (courtId: string, matchId?: string) => {
    setCourtsEntities((prev) =>
      prev.map((c) => (c.id === courtId ? { ...c, matchId, updatedAt: new Date().toISOString() } : c)),
    )
  }

  return (
    <CourtsContext.Provider
      value={{
        courts: courtsEntities.length,
        setCourtsEntities,
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
