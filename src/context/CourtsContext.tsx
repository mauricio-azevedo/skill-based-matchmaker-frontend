// src/context/CourtsContext.tsx
import { createContext, type Dispatch, type ReactNode, type SetStateAction, useContext } from 'react'
import useLocalStorage from '@/hooks/useLocalStorage'
import { FORMATION_MODES } from '@/context/FORMATION_MODES'

export const STORAGE_KEY_COURTS = 'match_courts'
export const STORAGE_KEY_MODE = 'match_formation_mode'
export const STORAGE_KEY_AUTO = 'match_auto_alternate'

export type FormationMode = (typeof FORMATION_MODES)[keyof typeof FORMATION_MODES]

type Ctx = {
  courts: number
  setCourts: Dispatch<SetStateAction<number>>
  formationMode: FormationMode
  setFormationMode: Dispatch<SetStateAction<FormationMode>>
  autoAlternate: boolean
  setAutoAlternate: Dispatch<SetStateAction<boolean>>
}

const CourtsContext = createContext<Ctx | undefined>(undefined)

export const CourtsProvider = ({ children }: { children: ReactNode }) => {
  const [courts, setCourts] = useLocalStorage<number>(STORAGE_KEY_COURTS, 2)
  const [formationMode, setFormationMode] = useLocalStorage<FormationMode>(
    STORAGE_KEY_MODE,
    FORMATION_MODES.HOMOGENEOUS,
  )
  const [autoAlternate, setAutoAlternate] = useLocalStorage<boolean>(STORAGE_KEY_AUTO, false)

  return (
    <CourtsContext.Provider
      value={{ courts, setCourts, formationMode, setFormationMode, autoAlternate, setAutoAlternate }}
    >
      {children}
    </CourtsContext.Provider>
  )
}

export const useCourts = () => {
  const ctx = useContext(CourtsContext)
  if (!ctx) throw new Error('useCourts must be inside CourtsProvider')
  return ctx
}
