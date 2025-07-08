// src/context/CourtsContext.tsx
import { createContext, type Dispatch, type ReactNode, type SetStateAction, useContext } from 'react'
import useLocalStorage from '@/hooks/useLocalStorage'

export const STORAGE_KEY_COURTS = 'match_courts'
export const STORAGE_KEY_VARIATION = 'match_variation_level'

export type VariationLevel = 'low' | 'high'

type Ctx = {
  courts: number
  setCourts: Dispatch<SetStateAction<number>>
  variation: VariationLevel
  setVariation: Dispatch<SetStateAction<VariationLevel>>
}

const CourtsContext = createContext<Ctx | undefined>(undefined)

export const CourtsProvider = ({ children }: { children: ReactNode }) => {
  const [courts, setCourts] = useLocalStorage<number>(STORAGE_KEY_COURTS, 2)
  const [variation, setVariation] = useLocalStorage<VariationLevel>(STORAGE_KEY_VARIATION, 'low')

  return (
    <CourtsContext.Provider value={{ courts, setCourts, variation, setVariation }}>{children}</CourtsContext.Provider>
  )
}

export const useCourts = () => {
  const ctx = useContext(CourtsContext)
  if (!ctx) throw new Error('useCourts must be inside CourtsProvider')
  return ctx
}
