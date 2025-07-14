import { useCallback, useMemo } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MatchCard } from '@/components/MatchCard'
import { useCourts } from '@/context/CourtsContext'
import { useMatchManager } from '@/hooks/useMatchManager'
import { useMatches } from '@/context/MatchesContext'

/**
 * Aba de jogo que lista as quadras e permite iniciar ou regenerar partidas.
 */
export function PlayTab() {
  const { courtsEntities } = useCourts()
  const courts = useMemo(() => Object.values(courtsEntities), [courtsEntities])
  const { generateAndStartMatch } = useMatchManager()
  const { getById } = useMatches()

  const handleStart = useCallback(
    async (courtId: string) => {
      try {
        generateAndStartMatch(courtId)
      } catch (error) {
        console.error(error)
      }
    },
    [generateAndStartMatch],
  )

  if (courts.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma quadra cadastrada.</p>
  }

  return (
    <div className="w-full space-y-2 overflow-auto">
      {courts.map((court, courtIdx) => {
        const match = court.matchId ? getById(court.matchId) : null
        const isOngoing = match?.status === 'ongoing'

        return (
          <Card key={courtIdx} className="!h-[218px] !gap-6">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Quadra {courtIdx + 1}</CardTitle>
            </CardHeader>
            <CardContent>
              {match ? (
                <MatchCard key={match.id ?? court.id} match={match} />
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma partida gerada.</p>
              )}
            </CardContent>
            <CardFooter>
              <Button size="sm" className="w-full" disabled={isOngoing} onClick={() => handleStart(court.id)}>
                {match ? 'Gerar nova partida' : 'Iniciar partida'}
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}
