import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MatchCard } from '@/components/MatchCard'
import { useCourts } from '@/context/CourtsContext'
import { useMatches } from '@/context/MatchesContext'
import { usePlayers } from '@/context/PlayersContext'
import { useFormationMode } from '@/context/FormationModeContext'
import { generateMatch } from '@/lib/algorithm'
import { FORMATION_MODES, type FormationMode } from '@/types/types'

export function PlayTab() {
  const { courtsEntities, updateCourt } = useCourts()
  const { matches, getById, addMatch } = useMatches()
  const { players } = usePlayers()
  const { formationMode, autoAlternate } = useFormationMode()

  const handleGenerateMatch = (courtId: string, lastMatchFormationMode?: FormationMode) => {
    try {
      const activePlayers = players.filter((p) => p.active)
      const ongoingIds = new Set(
        matches
          .filter((m) => m.status === 'ongoing')
          .flatMap((m) => [m.teamAPlayer1, m.teamAPlayer2, m.teamBPlayer1, m.teamBPlayer2]),
      )
      const availablePlayers = activePlayers.filter((p) => !ongoingIds.has(p.id))
      if (availablePlayers.length < 4) {
        throw new Error('Não há jogadores suficientes disponíveis para gerar partida.')
      }

      let modeToUse: FormationMode = formationMode
      if (autoAlternate) {
        // se vier um modo da própria quadra, alterna com base nele
        if (lastMatchFormationMode != null) {
          modeToUse =
            lastMatchFormationMode === FORMATION_MODES.HOMOGENEOUS ? FORMATION_MODES.MIXED : FORMATION_MODES.HOMOGENEOUS
        } else {
          // sem histórico nesta quadra; decide pelo histórico global
          if (matches.length === 0) {
            modeToUse = FORMATION_MODES.MIXED
          } else {
            // pega a última partida criada globalmente (maior startTime)
            const lastGlobalMatch = matches.reduce((prev, curr) =>
              new Date(prev.startTime).getTime() > new Date(curr.startTime).getTime() ? prev : curr,
            )
            modeToUse =
              lastGlobalMatch.formationMode === FORMATION_MODES.HOMOGENEOUS
                ? FORMATION_MODES.MIXED
                : FORMATION_MODES.HOMOGENEOUS
          }
        }
      }

      const { teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2 } = generateMatch(availablePlayers, modeToUse)
      const now = new Date().toISOString()
      const newMatchId = addMatch({
        courtId,
        teamAPlayer1,
        teamAPlayer2,
        teamBPlayer1,
        teamBPlayer2,
        startTime: now,
        endTime: null,
        status: 'ongoing',
        gamesA: null,
        gamesB: null,
        winner: null,
        formationMode: modeToUse,
      })

      updateCourt(courtId, newMatchId)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar partida.'
      console.error(err)
      alert(message)
    }
  }

  return (
    <div className="w-full space-y-2 overflow-auto">
      {Object.values(courtsEntities).length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma quadra cadastrada.</p>
      )}

      {Object.values(courtsEntities).map((court, idx) => {
        const matchId = court.matchId
        const match = matchId ? getById(matchId) : null
        const isOngoing = match?.status === 'ongoing'
        const courtNumber = idx + 1

        if (!match) {
          return <span className="text-muted-foreground text-sm">Nenhuma partida gerada.</span>
        }

        return (
          <Card key={court.id} className="!h-[218px] !gap-6">
            <CardHeader className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <CardTitle>Quadra {courtNumber}</CardTitle>
              </div>
            </CardHeader>

            <CardContent>
              <MatchCard key={matchId ?? court.id} match={match} />
            </CardContent>

            <CardFooter>
              <Button
                size="sm"
                className="w-full"
                disabled={isOngoing}
                onClick={() => handleGenerateMatch(court.id, match?.formationMode)}
              >
                Gerar nova partida
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
