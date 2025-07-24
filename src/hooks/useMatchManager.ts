import { useCallback } from 'react'
import { useMatches } from '@/context/MatchesContext'
import { usePlayers } from '@/context/PlayersContext'
import { useCourts } from '@/context/CourtsContext'
import { generateMatch } from '@/lib/algorithm'
import { type Match, type MatchPlayers, type Player } from '@/types/entities'
import { type CreateMatchPayload, type FormationMode, type MatchResult } from '@/types/types'
import { FORMATION_MODES } from '@/lib/formationModes'
import { singleToastError } from '@/utils/singleToast'
import { getBusyPlayerIds } from '@/lib/matchUtils'
import { buildStats } from '@/lib/stats'

const MIN_PLAYERS = 4

// Utilitário genérico de pluralização
function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}

// Mensagem de erro para falta de jogadores
function getMissingMessage(
  type: 'registered' | 'active_and_free',
  total: number,
  active: number,
  free: number,
  required: number,
): string {
  const missingFree = required - free
  const inactiveCount = total - active
  const busyCount = active - free

  switch (type) {
    case 'registered':
      return `Cadastre pelo menos ${required} jogadores para iniciar uma partida.`

    case 'active_and_free': {
      const details = []
      if (inactiveCount > 0) {
        const inactiveText =
          inactiveCount === total
            ? 'todos estão inativos'
            : `${inactiveCount} ${pluralize(inactiveCount, 'está inativo', 'estão inativos')}`
        details.push(inactiveText)
      }
      if (busyCount > 0) {
        const busyText =
          busyCount === active
            ? 'todos estão ocupados'
            : `${busyCount} ${pluralize(busyCount, 'está ocupado', 'estão ocupados')}`
        details.push(busyText)
      }
      const detailsMessage = details.length > 0 ? `. Dos ${total} cadastrados, ${details.join(' e ')}` : ''
      return `Faltam ${missingFree} jogadores para iniciar uma partida${detailsMessage}.`
    }
  }
}

// Resultado da validação de elegibilidade
type EligibilityResult =
  | { success: true; players: Player[] }
  | { success: false; type: 'registered' | 'active_and_free'; total: number; active: number; free: number }

// Retorna jogadores livres elegíveis ou falha explícita com todos os contadores
function computeEligibility(allPlayers: Player[], matches: Match[]): EligibilityResult {
  const total = allPlayers.length
  const activeList = allPlayers.filter((p) => p.active)
  const activeCount = activeList.length
  const busyIds: Set<string> = getBusyPlayerIds(matches)
  const freeList = activeList.filter((p) => !busyIds.has(p.id))
  const freeCount = freeList.length

  if (total < MIN_PLAYERS) {
    return { success: false, type: 'registered', total, active: activeCount, free: freeCount }
  }

  if (freeCount < MIN_PLAYERS) {
    return { success: false, type: 'active_and_free', total, active: activeCount, free: freeCount }
  }

  return { success: true, players: freeList }
}

// Exibe toast de erro para um resultado de elegibilidade com falha
function showEligibilityError(result: Extract<EligibilityResult, { success: false }>) {
  const { type, total, active, free } = result
  const message: string = getMissingMessage(type, total, active, free, MIN_PLAYERS)
  singleToastError(message, { duration: 3000 })
}

// Lógica de alternância de formação de equipes
function determineFormationMode(
  defaultMode: FormationMode,
  autoAlternate: boolean,
  matches: Match[],
  courtId: string,
): FormationMode {
  if (!autoAlternate) return defaultMode

  // Filtra matches apenas dessa quadra
  const courtMatches = matches.filter((m) => m.courtId === courtId)
  if (courtMatches.length === 0) return FORMATION_MODES.MIXED

  const lastMatch = courtMatches.reduce((prev, curr) =>
    new Date(prev.startTime) > new Date(curr.startTime) ? prev : curr,
  )

  return lastMatch.formationMode === FORMATION_MODES.HOMOGENEOUS ? FORMATION_MODES.MIXED : FORMATION_MODES.HOMOGENEOUS
}

export function useMatchManager(): {
  generateAndStartMatch: (courtId: string) => void
  completeMatch: (matchId: string, gamesA: number, gamesB: number) => void
  selectAlternative: (matchId: string, alternative: MatchPlayers) => void
} {
  const { players, updatePlayers } = usePlayers()
  const { addMatch, matches, getById, updateMatch } = useMatches()
  const { courts, updateCourt } = useCourts()
  const { partnerCounts } = buildStats(matches)

  /* ajusta referenceMatchCount */
  const adjustPlayersMatchCount = useCallback(
    (ids: string[], delta: number) => {
      const now = new Date().toISOString()
      updatePlayers((prev) =>
        prev.map((p) =>
          ids.includes(p.id)
            ? { ...p, referenceMatchCount: Math.max(0, p.referenceMatchCount + delta), updatedAt: now }
            : p,
        ),
      )
    },
    [updatePlayers],
  )

  /* adiciona partida, vincula quadra e incrementa contador dos jogadores */
  const addMatchToCourt = useCallback(
    (d: CreateMatchPayload) => {
      const id = addMatch(d)
      updateCourt(d.courtId, { matchId: id })
      return id
    },
    [addMatch, updateCourt],
  )

  const generateAndStartMatch = useCallback(
    (courtId: string) => {
      const court = courts.find((c) => c.id === courtId)
      if (!court) throw new Error('Quadra não encontrada')

      // valida e obtém jogadores livres elegíveis
      const result = computeEligibility(players, matches)

      if (!result.success) {
        showEligibilityError(result)
        return
      }

      const freePlayers: Player[] = result.players
      const modeToUse = determineFormationMode(court.formationMode, court.autoAlternate, matches, courtId)
      const matchResult: MatchResult = generateMatch(freePlayers, modeToUse, partnerCounts, matches)

      addMatchToCourt({
        courtId,
        startTime: new Date().toISOString(),
        endTime: null,
        status: 'ongoing',
        gamesA: null,
        gamesB: null,
        winner: null,
        formationMode: modeToUse,
        alternatives: matchResult.alternatives,
        ...matchResult.players,
      })
    },
    [players, matches, courts, partnerCounts, addMatchToCourt],
  )

  const completeMatch = useCallback(
    (matchId: string, gamesA: number, gamesB: number) => {
      const match = getById(matchId)
      if (!match || gamesA === gamesB) return

      const winner: 'A' | 'B' = gamesA > gamesB ? 'A' : 'B'

      updateMatch(matchId, {
        gamesA,
        gamesB,
        winner,
        status: 'completed',
        endTime: new Date().toISOString(),
      })

      adjustPlayersMatchCount([match.teamAPlayer1, match.teamAPlayer2, match.teamBPlayer1, match.teamBPlayer2], 1)
    },
    [getById, updateMatch, adjustPlayersMatchCount],
  )

  const selectAlternative = useCallback(
    (matchId: string, alternative: MatchPlayers) => {
      const match = getById(matchId)
      if (!match) throw new Error('Partida não encontrada')

      // captura jogadores atuais
      const previousPlayers: MatchPlayers = {
        teamAPlayer1: match.teamAPlayer1,
        teamAPlayer2: match.teamAPlayer2,
        teamBPlayer1: match.teamBPlayer1,
        teamBPlayer2: match.teamBPlayer2,
      }

      // Remove a alternativa selecionada
      const updatedAlternatives = match.alternatives.filter((alt) => alt !== alternative)

      // atualiza a partida: aplica a alternativa e empurra os antigos p/ alternatives
      updateMatch(matchId, {
        teamAPlayer1: alternative.teamAPlayer1,
        teamAPlayer2: alternative.teamAPlayer2,
        teamBPlayer1: alternative.teamBPlayer1,
        teamBPlayer2: alternative.teamBPlayer2,
        alternatives: [...updatedAlternatives, previousPlayers],
      })
    },
    [getById, updateMatch],
  )

  return { generateAndStartMatch, completeMatch, selectAlternative }
}
