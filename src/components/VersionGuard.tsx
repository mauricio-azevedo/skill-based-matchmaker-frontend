import { type ReactNode, useEffect } from 'react'
import { useMatches } from '@/context/MatchesContext'
import { useCourts } from '@/context/CourtsContext'
import { usePlayers } from '@/context/PlayersContext'

// Atualize esta constante sempre que quebrar compatibilidade de dados
const APP_VERSION = '2.0.0'
const STORAGE_VERSION_KEY = 'appVersion'

/**
 Componente que verifica a versão da aplicação e limpa dados se necessário.
 */
export function VersionGuard({ children }: { children: ReactNode }) {
  const { clearMatches } = useMatches()
  const { clearCourts } = useCourts()
  const { updatePlayers } = usePlayers()

  useEffect(() => {
    const storedVersion = window.localStorage.getItem(STORAGE_VERSION_KEY)
    if (storedVersion !== APP_VERSION) {
      // Limpa tudo: dados e versão
      window.localStorage.clear()
      clearMatches()
      clearCourts()
      updatePlayers(() => [])
      window.localStorage.setItem(STORAGE_VERSION_KEY, APP_VERSION)
    }
  }, [])

  return <>{children}</>
}
