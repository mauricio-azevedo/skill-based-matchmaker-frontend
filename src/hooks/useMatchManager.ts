import { useCallback } from 'react'
import { useMatches } from '@/context/MatchesContext'
import { usePlayers } from '@/context/PlayersContext'
import { useCourts } from '@/context/CourtsContext'
import { generateMatch } from '@/lib/algorithm'
import { type Match, type Player } from '@/types/entities'
import { type CreateMatchPayload, type FormationMode } from '@/types/types'
import { FORMATION_MODES } from '@/lib/formationModes'
import { singleToastError } from '@/utils/singleToast'

const MIN_PLAYERS = 4

// Utilitário genérico de pluralização
function pluralize(count: number, singular: string, plural?: string): string {
  return count === 1 ? singular : (plural ?? `${singular}s`)
}

// Mensagem de erro para falta de jogadores
function getMissingMessage(playersCount: number, missingCount: number, type: 'cadastrado' | 'ativo' | 'livre'): string {
  const typeLabel = pluralize(playersCount, type, `${type}s`)
  if (playersCount === 0) {
    return `Não há ${pluralize(playersCount, 'jogador', 'jogadores')} ${typeLabel} no momento.`
  }
  return `Apenas ${playersCount} ${pluralize(
    playersCount,
    'jogador',
    'jogadores',
  )} ${typeLabel}. Faltam ${missingCount} para iniciar uma partida.`
}

// Resultado da validação de elegibilidade
type EligibilityResult =
  | { success: true; players: Player[] }
  | { success: false; type: 'cadastrado' | 'ativo' | 'livre'; count: number; missing: number }

// Retorna jogadores livres elegíveis ou falha explícita
function computeEligibility(allPlayers: Player[], matches: Match[]): EligibilityResult {
  // Total cadastrados
  const total = allPlayers.length
  if (total < MIN_PLAYERS) {
    return { success: false, type: 'cadastrado', count: total, missing: MIN_PLAYERS - total }
  }

  // Ativos
  const active = allPlayers.filter((p) => p.active)
  if (active.length < MIN_PLAYERS) {
    return { success: false, type: 'ativo', count: active.length, missing: MIN_PLAYERS - active.length }
  }

  // Livres
  const busyIds = new Set(
    matches
      .filter((m) => m.status === 'ongoing')
      .flatMap(({ teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2 }) => [
        teamAPlayer1,
        teamAPlayer2,
        teamBPlayer1,
        teamBPlayer2,
      ]),
  )
  const freePlayers = active.filter((p) => !busyIds.has(p.id))
  if (freePlayers.length < MIN_PLAYERS) {
    return { success: false, type: 'livre', count: freePlayers.length, missing: MIN_PLAYERS - freePlayers.length }
  }

  return { success: true, players: freePlayers }
}

// Exibe toast de erro para um resultado de elegibilidade com falha
function showEligibilityError(result: Extract<EligibilityResult, { success: false }>) {
  const message = getMissingMessage(result.count, result.missing, result.type)
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

export function useMatchManager(): { generateAndStartMatch: (courtId: string) => void } {
  const { players } = usePlayers()
  const { addMatch, matches } = useMatches()
  const { courts, updateCourt } = useCourts()

  const addMatchToCourt = useCallback(
    (data: CreateMatchPayload): string => {
      // 1) cria a partida
      const matchId = addMatch(data)
      // 2) vincula a quadra, agora passando um objeto de updates
      updateCourt(data.courtId, { matchId })
      return matchId
    },
    [addMatch, updateCourt],
  )

  const generateAndStartMatch = useCallback(
    (courtId: string): void => {
      const court = courts.find((c) => c.id === courtId)
      if (!court) throw new Error('Quadra não encontrada')

      // valida e obtém jogadores livres elegíveis
      const result = computeEligibility(players, matches)
      if (!result.success) {
        showEligibilityError(result)
        return
      }
      const freePlayers: Player[] = result.players

      // Gera e inicia partida
      const { formationMode: defaultMode, autoAlternate } = court
      const modeToUse = determineFormationMode(defaultMode, autoAlternate, matches, courtId)
      const teams = generateMatch(freePlayers, modeToUse)
      const startTime = new Date().toISOString()

      addMatchToCourt({
        courtId,
        ...teams,
        startTime,
        endTime: null,
        status: 'ongoing',
        gamesA: null,
        gamesB: null,
        winner: null,
        formationMode: modeToUse,
      })
    },
    [players, matches, courts, addMatchToCourt],
  )

  return { generateAndStartMatch }
}
