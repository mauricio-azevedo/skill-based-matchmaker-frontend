import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MatchCard } from '@/components/MatchCard'
import { useCourts } from '@/context/CourtsContext'
import { useMatches } from '@/context/MatchesContext'
import { usePlayers } from '@/context/PlayersContext'
import { useFormationMode } from '@/context/FormationModeContext'
import { generateMatch } from '@/lib/algorithm'

export function PlayTab() {
  const { courts, updateCourt } = useCourts()
  const { matches, getById, addMatch } = useMatches()
  const { players } = usePlayers()
  const { formationMode, autoAlternate, autoAlternateMode } = useFormationMode()

  const handleGenerateMatch = (courtId: string) => {
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

      let modeToUse = formationMode
      if (autoAlternate) {
        const pastMatchesCount = matches.filter((m) => m.courtId === courtId).length
        modeToUse = pastMatchesCount % 2 === 0 ? formationMode : autoAlternateMode
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

      updateCourt(courtId, { ongoingMatchId: newMatchId })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar partida.'
      console.error(err)
      alert(message)
    }
  }

  return (
    <div className="space-y-4">
      {Object.values(courts).length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma quadra cadastrada.</p>
      )}

      {Object.values(courts).map((court, index) => {
        const matchId = court.ongoingMatchId
        const match = matchId ? (getById(matchId) ?? null) : null
        const isOngoing = match?.status === 'ongoing'
        const courtNumber = index + 1

        return (
          <Card key={court.id} className="!h-[unset] !gap-8">
            <CardHeader className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <CardTitle>Quadra {courtNumber}</CardTitle>
                {match && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-800 uppercase">
                    {match.formationMode}
                  </span>
                )}
              </div>
            </CardHeader>

            <CardContent>
              <MatchCard key={matchId ?? court.id} match={match} />
            </CardContent>

            <CardFooter>
              <Button size="sm" className="w-full" disabled={isOngoing} onClick={() => handleGenerateMatch(court.id)}>
                Gerar nova partida
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
