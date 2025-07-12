import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MatchCard } from '@/components/MatchCard'
import { useCourts } from '@/context/CourtsContext'
import { useMatches } from '@/context/MatchesContext'
import { usePlayers } from '@/context/PlayersContext'
import { FORMATION_MODES } from '@/types/types'
import { generateMatch } from '@/lib/algorithm'

export function PlayTab() {
  const { courts, updateCourt } = useCourts()
  const { getById, addMatch } = useMatches()
  const { players } = usePlayers()

  const handleGenerateMatch = (courtId: string) => {
    try {
      // Filtra apenas jogadores ativos
      const activePlayers = players.filter((p) => p.active)

      // Gera a combinação de equipes
      const { teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2 } = generateMatch(
        activePlayers,
        FORMATION_MODES.MIXED,
      )

      // Monta dados iniciais da partida
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
        formationMode: FORMATION_MODES.MIXED,
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

      {Object.values(courts).map((court) => {
        const matchId = court.ongoingMatchId
        const match = matchId ? (getById(matchId) ?? null) : null
        const isOngoing = match?.status === 'ongoing'

        return (
          <Card key={court.id}>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Quadra {court.id}</CardTitle>
            </CardHeader>

            <CardContent>
              <MatchCard key={matchId ?? court.id} match={match} />
            </CardContent>

            <CardFooter>
              <Button disabled={isOngoing} onClick={() => handleGenerateMatch(court.id)}>
                Gerar nova partida
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
