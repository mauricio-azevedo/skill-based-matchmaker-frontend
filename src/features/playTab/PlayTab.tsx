import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { MatchCard } from '@/components/MatchCard'
import { useCourts } from '@/context/CourtsContext'
import { useMatches } from '@/context/MatchesContext'

export function PlayTab() {
  const { courts } = useCourts()
  const { getById } = useMatches()

  return (
    <div className="space-y-4">
      {Object.values(courts).length === 0 && (
        <p className="text-sm text-muted-foreground">Nenhuma quadra cadastrada.</p>
      )}

      {Object.values(courts).map((court) => {
        const matchId = court.ongoingMatchId
        const match = matchId ? (getById(matchId) ?? null) : null

        return (
          <Card key={court.id}>
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Quadra {court.id}</CardTitle>
            </CardHeader>

            <CardContent>
              <MatchCard match={match} />
            </CardContent>

            <CardFooter>{/* Botão para gerar nova partida, se for o caso */}</CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
