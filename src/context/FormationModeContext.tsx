import { createContext, type Dispatch, type ReactNode, type SetStateAction, useContext } from 'react'
import useLocalStorage from '@/hooks/useLocalStorage'
import type { FormationMode } from '@/types/types'
import { FORMATION_MODES } from '@/lib/formationModes'

export const STORAGE_KEY_MODE = 'match_formation_mode'
export const STORAGE_KEY_AUTO = 'match_auto_alternate'

type Ctx = {
  formationMode: FormationMode
  setFormationMode: Dispatch<SetStateAction<FormationMode>>
  autoAlternate: boolean
  setAutoAlternate: Dispatch<SetStateAction<boolean>>
}

const FormationModeContext = createContext<Ctx | undefined>(undefined)

export const FormationModeProvider = ({ children }: { children: ReactNode }) => {
  const [formationMode, setFormationMode] = useLocalStorage<FormationMode>(
    STORAGE_KEY_MODE,
    FORMATION_MODES.HOMOGENEOUS,
  )
  const [autoAlternate, setAutoAlternate] = useLocalStorage<boolean>(STORAGE_KEY_AUTO, true)

  return (
    <FormationModeContext.Provider
      value={{
        formationMode,
        setFormationMode,
        autoAlternate,
        setAutoAlternate,
      }}
    >
      {children}
    </FormationModeContext.Provider>
  )
}

export const useFormationMode = () => {
  const ctx = useContext(FormationModeContext)
  if (!ctx) throw new Error('useFormationMode must be inside FormationModeProvider')
  return ctx
}
