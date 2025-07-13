import { createContext, type FC, type ReactNode, useContext, useState } from 'react'

interface CourtsCtx {
  courts: number
  setCourts: (count: number) => void
}

const CourtsContext = createContext<CourtsCtx | undefined>(undefined)

export const CourtsProvider: FC<{ children: ReactNode }> = ({ children }) => {
  const [courts, setCourts] = useState<number>(1)

  return <CourtsContext.Provider value={{ courts, setCourts }}>{children}</CourtsContext.Provider>
}

export const useCourts = (): CourtsCtx => {
  const context = useContext(CourtsContext)
  if (!context) {
    throw new Error('useCourts deve ser usado dentro de um CourtsProvider')
  }
  return context
}
