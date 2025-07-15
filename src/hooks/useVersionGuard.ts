import { useCallback, useEffect } from 'react'
import { useMatches } from '@/context/MatchesContext'
import { useCourts } from '@/context/CourtsContext'
import { usePlayers } from '@/context/PlayersContext'
import { APP_VERSION, STORAGE_VERSION_KEY } from '@/consts/version'

/**
 * Custom hook to enforce version guard and expose a manual reset function.
 */
export function useVersionGuard() {
  const { clearMatches } = useMatches()
  const { clearCourts } = useCourts()
  const { updatePlayers } = usePlayers()

  /**
   * Clears all stored data and resets application state.
   */
  const performVersionCleanup = useCallback(() => {
    window.localStorage.clear()
    clearMatches()
    clearCourts()
    updatePlayers(() => [])
    window.localStorage.setItem(STORAGE_VERSION_KEY, APP_VERSION)
  }, [clearMatches, clearCourts, updatePlayers])

  useEffect(() => {
    const storedVersion = window.localStorage.getItem(STORAGE_VERSION_KEY)
    if (storedVersion !== APP_VERSION) {
      performVersionCleanup()
    }
  }, [performVersionCleanup])

  return { performVersionCleanup }
}
