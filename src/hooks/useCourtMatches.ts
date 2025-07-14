import { useMatches } from '@/context/MatchesContext'
import { useCourts } from '@/context/CourtsContext'
import type { CreateMatchPayload } from '@/types/types'

export function useCourtMatches() {
  const { addMatch } = useMatches()
  const { updateCourt } = useCourts()

  /**
   * Cria uma partida e já vincula nela a quadra informada.
   * @returns o matchId recém-criado
   */
  function addMatchToCourt(data: CreateMatchPayload): string {
    // 1) cria a partida
    const matchId = addMatch(data)
    // 2) vincula automaticamente a quadra à essa partida
    updateCourt(data.courtId, matchId)
    return matchId
  }

  return { addMatchToCourt }
}
