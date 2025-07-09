// src/context/CourtsContext.tsx
import { createContext, type Dispatch, type ReactNode, type SetStateAction, useContext } from 'react'
import useLocalStorage from '@/hooks/useLocalStorage'

export const STORAGE_KEY_COURTS = 'match_courts'
export const STORAGE_KEY_VARIATION = 'match_variation_enabled'

type Ctx = {
  courts: number
  setCourts: Dispatch<SetStateAction<number>>
  variationEnabled: boolean
  setVariationEnabled: Dispatch<SetStateAction<boolean>>
}

const CourtsContext = createContext<Ctx | undefined>(undefined)

export const CourtsProvider = ({ children }: { children: ReactNode }) => {
  const [courts, setCourts] = useLocalStorage<number>(STORAGE_KEY_COURTS, 2)
  const [variationEnabled, setVariationEnabled] = useLocalStorage<boolean>(STORAGE_KEY_VARIATION, false)

  return (
    <CourtsContext.Provider value={{ courts, setCourts, variationEnabled, setVariationEnabled }}>
      {children}
    </CourtsContext.Provider>
  )
}

export const useCourts = () => {
  const ctx = useContext(CourtsContext)
  if (!ctx) throw new Error('useCourts must be inside CourtsProvider')
  return ctx
}
