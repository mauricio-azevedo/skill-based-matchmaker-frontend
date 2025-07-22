import { useCallback } from 'react'
import { useMatches } from '@/context/MatchesContext'
import { usePlayers } from '@/context/PlayersContext'
import { useCourts } from '@/context/CourtsContext'
import { generateMatch } from '@/lib/algorithm'
import { type Match, type Player } from '@/types/entities'
import { type CreateMatchPayload, type FormationMode } from '@/types/types'
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
  shuffleMatch: (courtId: string) => void
} {
  const { players, updatePlayers } = usePlayers()
  const { addMatch, matches, getById, deleteMatch } = useMatches()
  const { courts, updateCourt } = useCourts()
  const { partnerCounts } = buildStats(matches)

  /* ajusta referenceMatchCount */
  const adjustRef = useCallback(
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
      adjustRef([d.teamAPlayer1, d.teamAPlayer2, d.teamBPlayer1, d.teamBPlayer2], +1)
      return id
    },
    [addMatch, updateCourt, adjustRef],
  )

  /* apaga partida, remove da quadra e decrementa contador dos jogadores */
  const removeMatchFromCourt = useCallback(
    (courtId: string, matchId: string) => {
      const match = getById(matchId)
      if (!match) return
      adjustRef([match.teamAPlayer1, match.teamAPlayer2, match.teamBPlayer1, match.teamBPlayer2], -1)
      deleteMatch(matchId)
      updateCourt(courtId, { matchId: null })
    },
    [getById, deleteMatch, updateCourt, adjustRef],
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
      const teams = generateMatch(freePlayers, modeToUse, partnerCounts)

      addMatchToCourt({
        courtId,
        ...teams,
        startTime: new Date().toISOString(),
        endTime: null,
        status: 'ongoing',
        gamesA: null,
        gamesB: null,
        winner: null,
        formationMode: modeToUse,
        shuffleHistory: [],
      })
    },
    [players, matches, courts, partnerCounts, addMatchToCourt],
  )

  const shuffleMatch = useCallback(
    (courtId: string) => {
      const court = courts.find((c) => c.id === courtId)
      if (!court) throw new Error('Quadra não encontrada')
      if (!court.matchId) return singleToastError('Nenhuma partida em andamento nesta quadra.')

      const currentMatch: Match | null = getById(court.matchId)
      if (!currentMatch) return singleToastError('Partida não encontrada.')

      const mode: FormationMode = court.autoAlternate ? currentMatch.formationMode : court.formationMode

      /* jogadores livres, ignorando a partida atual */
      const busy = getBusyPlayerIds(matches.filter((m) => m.id !== currentMatch.id))
      const freePlayers = players.filter((p) => p.active && !busy.has(p.id))
      if (freePlayers.length < MIN_PLAYERS) return singleToastError('Jogadores suficientes não disponíveis.')

      /* combinações já usadas */
      const excluded = new Set<string>()
      const addKey = (m: { teamAPlayer1: string; teamAPlayer2: string; teamBPlayer1: string; teamBPlayer2: string }) =>
        excluded.add(
          [[m.teamAPlayer1, m.teamAPlayer2].sort().join('|'), [m.teamBPlayer1, m.teamBPlayer2].sort().join('|')]
            .sort()
            .join('#'),
        )
      addKey(currentMatch)
      currentMatch.shuffleHistory.forEach(addKey)

      let newTeams
      try {
        newTeams = generateMatch(freePlayers, mode, partnerCounts, excluded)
      } catch (e) {
        return singleToastError(e instanceof Error ? e.message : 'Erro ao gerar combinação.')
      }

      /* novo histórico = histórico anterior + combinação que acabou de sair */
      const newHistory = [
        ...currentMatch.shuffleHistory,
        {
          teamAPlayer1: currentMatch.teamAPlayer1,
          teamAPlayer2: currentMatch.teamAPlayer2,
          teamBPlayer1: currentMatch.teamBPlayer1,
          teamBPlayer2: currentMatch.teamBPlayer2,
        },
      ]

      /* remove a partida antiga e cria uma nova, preservando o histórico */
      removeMatchFromCourt(courtId, currentMatch.id)

      addMatchToCourt({
        courtId,
        ...newTeams,
        startTime: new Date().toISOString(),
        endTime: null,
        status: 'ongoing',
        gamesA: null,
        gamesB: null,
        winner: null,
        formationMode: mode,
        shuffleHistory: newHistory,
      })
    },
    [courts, matches, players, partnerCounts, getById, removeMatchFromCourt, addMatchToCourt],
  )

  return { generateAndStartMatch, shuffleMatch }
}
