import { useMatches } from '@/context/MatchesContext'
import { useCourts } from '@/context/CourtsContext'
import type { Court } from '@/types/entities'
import { FORMATION_MODES } from '@/lib/formationModes'
import { useMatchManager } from '@/hooks/useMatchManager'
import { useEffect, useRef } from 'react'

export function useCourtMatches() {
  const { deleteMatch } = useMatches()
  const { courtsEntities, setCourtsEntities } = useCourts()
  const { generateAndStartMatch } = useMatchManager()
  const pendingNewCourtId = useRef<string | null>(null)

  /**
   * Remove quadras selecionadas e apaga as partidas associadas,
   * depois ajusta ao número final desejado.
   */
  function removeCourtsAndMatches(courtIds: string[], finalCount: number) {
    // 1) apagar partidas das quadras selecionadas
    courtsEntities
      .filter((c) => courtIds.includes(c.id) && c.matchId)
      .forEach((c) => {
        if (c.matchId) deleteMatch(c.matchId)
      })

    // 2) atualizar lista de quadras: remove as selecionadas, depois ajusta ao tamanho final
    setCourtsEntities((prev) => {
      let newList = prev.filter((c) => !courtIds.includes(c.id))
      if (newList.length > finalCount) {
        newList = newList.slice(0, finalCount)
      }
      const now = new Date().toISOString()
      return newList.map((c) => ({ ...c, updatedAt: now }))
    })
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
    setCourtsEntities((prev) => [...prev, newCourt])
    pendingNewCourtId.current = courtId
  }

  useEffect(() => {
    if (pendingNewCourtId.current) {
      const exists = courtsEntities.some((c) => c.id === pendingNewCourtId.current)
      if (exists) {
        generateAndStartMatch(pendingNewCourtId.current)
        pendingNewCourtId.current = null
      }
    }
  }, [courtsEntities, generateAndStartMatch])

  return {
    removeCourtsAndMatches,
    addCourtWithMatch,
  }
}
