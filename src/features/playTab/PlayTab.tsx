import { Fragment, useCallback, useMemo } from 'react'
import { MatchCard } from '@/components/MatchCard'
import { useCourts } from '@/context/CourtsContext'
import { useMatchManager } from '@/hooks/useMatchManager'
import { useMatches } from '@/context/MatchesContext'
import { Separator } from '@/components/ui/separator'
import { CourtCountSelector } from '@/components/CourtCountSelector'
import { Settings } from '@/components/Settings'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDownIcon } from 'lucide-react'
import { getNextModeLabel } from '@/lib/formationModes'

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
      <div className="flex justify-between items-center gap-2 pr-4">
        <h2 className="text-lg font-semibold leading-tight m-0 text-center w-full">Partidas</h2>
      </div>
      <Separator className="my-2" />
      <div className="flex justify-between items-center gap-2 pr-4">
        <CourtCountSelector />
      </div>
      <Separator className="mt-2" />

      <div className="h-full overflow-y-auto pt-4">
        {courts.map((court, courtIdx) => {
          const match = court.matchId ? getById(court.matchId) : null
          const isOngoing = match?.status === 'ongoing'

          const balanceLabel = getNextModeLabel(match?.formationMode, court.formationMode, court.autoAlternate)

          return (
            <Fragment key={court.id}>
              <div className="pr-4">
                <p className="text-lg font-semibold leading-tight mb-3">Quadra {courtIdx + 1}</p>
                {match ? (
                  <MatchCard key={match.id} match={match} />
                ) : (
                  <p className="text-sm text-muted-foreground leading-tight text-center items-center">
                    Nenhuma partida gerada.
                  </p>
                )}

                <div className="w-full mt-6 flex items-center">
                  <Button
                    size="sm"
                    disabled={isOngoing}
                    onClick={() => handleStart(court.id)}
                    className="rounded-l-md rounded-r-none flex-1 px-2"
                  >
                    <span>
                      Gerar nova partida{' '}
                      <span className="text-sm text-muted-foreground font-normal">({balanceLabel})</span>
                    </span>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        aria-label="Options"
                        className="rounded-r-md rounded-l-none border-l !border-l-neutral-300 !ring-0"
                        disabled={isOngoing}
                      >
                        <ChevronDownIcon size={16} aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      className="max-w-[calc(100vw-4rem)] md:max-w-xs p-0"
                      side="bottom"
                      sideOffset={4}
                      align="end"
                    >
                      <Settings courtId={court.id} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <Separator className="my-6" />
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
