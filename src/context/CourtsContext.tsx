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
  courts: Court[]
  setCourts: Dispatch<SetStateAction<Court[]>>
  updateCourt: (courtId: string, updates: Partial<Pick<Court, 'matchId' | 'formationMode' | 'autoAlternate'>>) => void
  clearCourts: () => void
}

const CourtsContext = createContext<CourtsCtx | undefined>(undefined)
const COURTS_KEY = 'courts'

export const CourtsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [courts, setCourts] = useState<Court[]>([])

  // Carrega do localStorage
  useEffect(() => {
    const stored = localStorage.getItem(COURTS_KEY)
    if (stored) {
      try {
        setCourts(JSON.parse(stored))
        return
      } catch {
        console.error('Erro lendo quadras do localStorage')
      }
    }
  }, [])

  // Persiste sempre que mudar
  useEffect(() => {
    localStorage.setItem(COURTS_KEY, JSON.stringify(courts))
  }, [courts])

  const updateCourt = (
    courtId: string,
    updates: Partial<Pick<Court, 'matchId' | 'formationMode' | 'autoAlternate'>>,
  ) => {
    setCourts((prev) =>
      prev.map((c) => (c.id === courtId ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c)),
    )
  }

  const clearCourts = () => {
    setCourts([])
  }

  return (
    <CourtsContext.Provider
      value={{
        courts,
        setCourts: setCourts,
        updateCourt,
        clearCourts,
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
