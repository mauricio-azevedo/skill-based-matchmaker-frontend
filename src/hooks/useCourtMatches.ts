import { useMatches } from '@/context/MatchesContext'
import { useCourts } from '@/context/CourtsContext'
import type { Court } from '@/types/entities'
import { FORMATION_MODES } from '@/lib/formationModes'
import { useMatchManager } from '@/hooks/useMatchManager'
import { useEffect, useRef } from 'react'

export function useCourtMatches() {
  const { deleteMatch } = useMatches()
  const { courts, setCourts } = useCourts()
  const { generateMatchAndAddToCourt } = useMatchManager()
  const pendingNewCourtId = useRef<string | null>(null)

  /**
   * Remove quadras selecionadas e apaga as partidas associadas,
   * depois ajusta ao número final desejado.
   */
  function removeCourtAndMatch(courtId: string): void {
    // 1) apagar partida da quadra selecionada
    const court = courts.find((c) => c.id === courtId)
    if (court?.matchId) {
      deleteMatch(court.matchId)
    }

    // 2) atualizar lista de quadras: remove a selecionada e atualiza updatedAt
    const now = new Date().toISOString()
    setCourts((prevCourts) => prevCourts.filter((c) => c.id !== courtId).map((c) => ({ ...c, updatedAt: now })))
  }

  function addCourtWithMatch() {
    const now = new Date().toISOString()
    const courtId = crypto.randomUUID()
    const newCourt: Court = {
      id: courtId,
      matchId: null,
      formationMode: FORMATION_MODES.MIXED,
      autoAlternate: true,
      createdAt: now,
      updatedAt: now,
    }
    setCourts((prev) => [...prev, newCourt])
    pendingNewCourtId.current = courtId
  }

  useEffect(() => {
    if (pendingNewCourtId.current) {
      const exists = courts.some((c) => c.id === pendingNewCourtId.current)
      if (exists) {
        generateMatchAndAddToCourt(pendingNewCourtId.current)
        pendingNewCourtId.current = null
      }
    }
  }, [courts, generateMatchAndAddToCourt])

  return {
    removeCourtAndMatch,
    addCourtWithMatch,
  }
}
