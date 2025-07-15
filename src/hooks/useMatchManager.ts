import { useCallback } from 'react'
import { useMatches } from '@/context/MatchesContext'
import { usePlayers } from '@/context/PlayersContext'
import { useCourts } from '@/context/CourtsContext'
import { generateMatch } from '@/lib/algorithm'
import { type Match } from '@/types/entities'
import { type CreateMatchPayload, type FormationMode } from '@/types/types'
import { FORMATION_MODES } from '@/lib/formationModes'

const MIN_PLAYERS = 4

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

      const { formationMode: defaultMode, autoAlternate } = court

      const activePlayers = players.filter((p) => p.active)
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
      const freePlayers = activePlayers.filter((p) => !busyIds.has(p.id))
      if (freePlayers.length < MIN_PLAYERS) {
        console.error(`Não há pelo menos ${MIN_PLAYERS} jogadores disponíveis.`)
        return
      }

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
