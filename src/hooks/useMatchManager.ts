import { useCallback } from 'react'
import { useMatches } from '@/context/MatchesContext'
import { usePlayers } from '@/context/PlayersContext'
import { useFormationMode } from '@/context/FormationModeContext'
import { generateMatch } from '@/lib/algorithm'
import { FORMATION_MODES, type FormationMode, type Match } from '@/types/entities'
import { useCourtMatches } from '@/hooks/useCourtMatches'

const MIN_PLAYERS = 4

/**
 * Determina o modo de formação a ser usado, alternando entre homogêneo e misto quando configurado.
 */
function determineFormationMode(defaultMode: FormationMode, autoAlternate: boolean, matches: Match[]): FormationMode {
  if (!autoAlternate) return defaultMode
  if (matches.length === 0) return FORMATION_MODES.MIXED

  const lastMatch = matches.reduce((prev, curr) => (new Date(prev.startTime) > new Date(curr.startTime) ? prev : curr))

  return lastMatch.formationMode === FORMATION_MODES.HOMOGENEOUS ? FORMATION_MODES.MIXED : FORMATION_MODES.HOMOGENEOUS
}

/**
 * Hook que encapsula lógica de geração e início de partidas.
 */
export function useMatchManager(): { generateAndStartMatch: (courtId: string) => void } {
  const { players } = usePlayers()
  const { matches } = useMatches()
  const { formationMode, autoAlternate } = useFormationMode()
  const { addMatchToCourt } = useCourtMatches()

  const generateAndStartMatch = useCallback(
    (courtId: string): void => {
      const activePlayers = players.filter((p) => p.active)

      // Identifica IDs de jogadores em partidas em andamento
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

      // Seleciona ativos e que não estão em partidas em andamento
      const freePlayers = activePlayers.filter(({ id }) => !busyIds.has(id))
      if (freePlayers.length < MIN_PLAYERS) {
        throw new Error(`Não há pelo menos ${MIN_PLAYERS} jogadores disponíveis para gerar partida.`)
      }

      const modeToUse = determineFormationMode(formationMode, autoAlternate, matches)

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
    [players, matches, formationMode, autoAlternate, addMatchToCourt],
  )

  return { generateAndStartMatch }
}
