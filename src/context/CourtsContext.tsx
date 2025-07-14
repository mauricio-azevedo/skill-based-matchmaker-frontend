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
  addCourt: () => void
  removeCourt: (courtId: string) => void
}

const CourtsContext = createContext<CourtsCtx | undefined>(undefined)
const COURTS_KEY = 'courts'

// Gera uma nova quadra com configurações padrão
const createDefaultCourt = (formationMode: Court['formationMode'] = FORMATION_MODES.MIXED): Court => {
  const now = new Date().toISOString()
  return {
    id: crypto.randomUUID(),
    matchId: null,
    formationMode,
    autoAlternate: true,
    createdAt: now,
    updatedAt: now,
  }
}

export const CourtsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  // Inicializa lendo do localStorage, ou cria uma quadra padrão
  const [courtsEntities, setCourtsEntities] = useState<Court[]>(() => {
    const stored = localStorage.getItem(COURTS_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      } catch (error) {
        console.error('Erro lendo quadras do localStorage', error)
      }
    }
    return [createDefaultCourt()]
  })

  // Persiste sempre que mudar
  useEffect(() => {
    localStorage.setItem(COURTS_KEY, JSON.stringify(courtsEntities))
  }, [courtsEntities])

  // Atualiza apenas um campo da quadra
  const updateCourt = (
    courtId: string,
    updates: Partial<Pick<Court, 'matchId' | 'formationMode' | 'autoAlternate'>>,
  ) => {
    console.log({ updates })
    setCourtsEntities((prev) =>
      prev.map((c) => (c.id === courtId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)),
    )
  }

  // Adiciona uma nova quadra padrão
  const addCourt = () => {
    setCourtsEntities((prev) => [...prev, createDefaultCourt()])
  }

  // Remove quadra e garante pelo menos uma
  const removeCourt = (courtId: string) => {
    setCourtsEntities((prev) => {
      const filtered = prev.filter((c) => c.id !== courtId)
      if (filtered.length === 0) {
        // se remover a última, cria uma nova homogênea
        return [createDefaultCourt(FORMATION_MODES.HOMOGENEOUS)]
      }
      return filtered
    })
  }

  return (
    <CourtsContext.Provider
      value={{
        courts: courtsEntities.length,
        courtsEntities,
        setCourtsEntities,
        updateCourt,
        addCourt,
        removeCourt,
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
