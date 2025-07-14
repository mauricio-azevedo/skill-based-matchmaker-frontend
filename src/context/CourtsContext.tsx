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
import { FORMATION_MODES } from '@/lib/formationModes'

interface CourtsCtx {
  courts: number
  courtsEntities: Court[]
  setCourtsEntities: Dispatch<SetStateAction<Court[]>>
  updateCourt: (courtId: string, updates: Partial<Pick<Court, 'matchId' | 'formationMode' | 'autoAlternate'>>) => void
}

const CourtsContext = createContext<CourtsCtx | undefined>(undefined)
const COURTS_KEY = 'courts'

export const CourtsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [courtsEntities, setCourtsEntities] = useState<Court[]>([])

  // Carrega do localStorage ou cria 1 quadra com configs padrão
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
    setCourtsEntities([
      {
        id: crypto.randomUUID(),
        matchId: null,
        formationMode: FORMATION_MODES.MIXED,
        autoAlternate: true,
        createdAt: now,
        updatedAt: now,
      },
    ])
  }, [])

  // Persiste sempre que mudar
  useEffect(() => {
    localStorage.setItem(COURTS_KEY, JSON.stringify(courtsEntities))
  }, [courtsEntities])

  const updateCourt = (
    courtId: string,
    updates: Partial<Pick<Court, 'matchId' | 'formationMode' | 'autoAlternate'>>,
  ) => {
    setCourtsEntities((prev) =>
      prev.map((c) => (c.id === courtId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)),
    )
  }

  return (
    <CourtsContext.Provider
      value={{
        courts: courtsEntities.length,
        courtsEntities,
        setCourtsEntities,
        updateCourt,
      }}
    >
      {children}
    </CourtsContext.Provider>
  )
}

export const useCourts = (): CourtsCtx => {
  const ctx = useContext(CourtsContext)
  if (!ctx) throw new Error('useCourts deve ser usado dentro de um CourtsProvider')
  return ctx
}
