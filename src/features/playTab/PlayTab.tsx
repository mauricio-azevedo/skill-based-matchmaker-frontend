import { Fragment, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { MatchCard } from '@/components/MatchCard'
import { useCourts } from '@/context/CourtsContext'
import { useMatchManager } from '@/hooks/useMatchManager'
import { useMatches } from '@/context/MatchesContext'
import { Separator } from '@/components/ui/separator'

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
    <div className="w-full pb-8 overflow-hidden pl-4">
      <h2 className="text-lg font-semibold mb-1">Partidas</h2>
      <Separator className="mb-4" />

      <div className="h-full overflow-y-auto">
        {courts.map((court, courtIdx) => {
          const match = court.matchId ? getById(court.matchId) : null
          const isOngoing = match?.status === 'ongoing'

          return (
            <Fragment key={court.id}>
              <div className="pr-4">
                <p className="text-lg font-semibold leading-tight mb-3">Quadra {courtIdx + 1}</p>
                {match ? (
                  <MatchCard key={match.id ?? court.id} match={match} />
                ) : (
                  <p className="text-sm text-muted-foreground leading-tight text-center items-center">
                    Nenhuma partida gerada.
                  </p>
                )}
                <Button size="sm" className="w-full mt-6" disabled={isOngoing} onClick={() => handleStart(court.id)}>
                  Gerar nova partida
                </Button>
              </div>
              <Separator className="my-6" />
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
