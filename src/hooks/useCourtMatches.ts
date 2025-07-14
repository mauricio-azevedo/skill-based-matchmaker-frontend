import { useMatches } from '@/context/MatchesContext'
import { useCourts } from '@/context/CourtsContext'
import type { CreateMatchPayload } from '@/types/types'
import type { Match } from '@/types/entities'

export function useCourtMatches() {
  const { addMatch, deleteMatch, matches } = useMatches()
  const { courtsEntities, setCourtsEntities, updateCourt } = useCourts()

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

  /**
   * Ajusta o número de quadras (1–6), adicionando ou removendo instâncias.
   * Não afeta partidas em andamento.
   */
  function updateCourtsCount(count: number) {
    setCourtsEntities((prev) => {
      const current = prev.length
      if (count === current) return prev
      const now = new Date().toISOString()

      if (count > current) {
        // adiciona novas quadras
        const toAdd = Array.from({ length: count - current }).map(() => ({
          id: crypto.randomUUID(),
          createdAt: now,
          updatedAt: now,
        }))
        return [...prev, ...toAdd]
      }

      // count < current: reduz sem tocar nas quadras com partidas em andamento
      const ongoingCourtIds = prev
        .filter((c) => {
          if (!c.matchId) return false
          const match: Match | undefined = matches.find((m) => m.id === c.matchId)
          return match?.status === 'ongoing'
        })
        .map((c) => c.id)

      if (count < ongoingCourtIds.length) {
        console.warn(`Não é possível reduzir para ${count} quadras: existem ${ongoingCourtIds.length} em andamento.`)
        return prev
      }

      const removable = prev.filter((c) => !ongoingCourtIds.includes(c.id))
      const numToKeepFromRemovable = count - ongoingCourtIds.length
      const removableIdsToKeep = new Set(removable.slice(0, numToKeepFromRemovable).map((c) => c.id))

      return prev
        .filter((c) => ongoingCourtIds.includes(c.id) || removableIdsToKeep.has(c.id))
        .map((c) => ({ ...c, updatedAt: now }))
    })
  }

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
      return newList.map((c) => ({
        ...c,
        updatedAt: now,
      }))
    })
  }

  return {
    addMatchToCourt,
    updateCourtsCount,
    removeCourtsAndMatches,
  }
}
