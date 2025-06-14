// src/context/CourtsContext.tsx
import { createContext, useContext, type ReactNode, type Dispatch, type SetStateAction } from 'react'
import useLocalStorage from '@/hooks/useLocalStorage'

export const STORAGE_KEY_COURTS = 'match_courts'

type Ctx = {
  courts: number
  setCourts: Dispatch<SetStateAction<number>> // 👈 aceita número ou função
}

const CourtsContext = createContext<Ctx | undefined>(undefined)

export const CourtsProvider = ({ children }: { children: ReactNode }) => {
  const [courts, setCourts] = useLocalStorage<number>(STORAGE_KEY_COURTS, 2)
  return <CourtsContext.Provider value={{ courts, setCourts }}>{children}</CourtsContext.Provider>
}

export const useCourts = () => {
  const ctx = useContext(CourtsContext)
  if (!ctx) throw new Error('useCourts must be inside CourtsProvider')
  return ctx
}
