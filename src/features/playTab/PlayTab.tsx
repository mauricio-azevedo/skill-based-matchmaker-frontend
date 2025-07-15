import { Fragment, useCallback, useMemo } from 'react'
import { MatchCard } from '@/components/MatchCard'
import { useCourts } from '@/context/CourtsContext'
import { useMatchManager } from '@/hooks/useMatchManager'
import { useMatches } from '@/context/MatchesContext'
import { Separator } from '@/components/ui/separator'
import { Settings } from '@/components/Settings'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDownIcon, MoreVertical, TrashIcon } from 'lucide-react'
import { useCourtMatches } from '@/hooks/useCourtMatches'
import { translateFormationMode } from '@/lib/formationModes'

export function PlayTab() {
  const { courtsEntities } = useCourts()
  const courts = useMemo(() => Object.values(courtsEntities), [courtsEntities])
  const { generateAndStartMatch } = useMatchManager()
  const { getById } = useMatches()
  const { removeCourtsAndMatches } = useCourtMatches()

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

  const handleDeleteCourt = useCallback(
    (courtId: string) => {
      if (confirm('Deseja realmente remover essa quadra e suas partidas associadas?')) {
        removeCourtsAndMatches([courtId], courts.length - 1)
      }
    },
    [removeCourtsAndMatches, courts.length],
  )

  if (courts.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma quadra cadastrada.</p>
  }

  return (
    <div className="w-full overflow-hidden">
      <div className="flex justify-between items-center gap-2 pr-4">
        <h2 className="text-lg font-semibold leading-tight m-0 text-center w-full">Partidas</h2>
      </div>
      <Separator className="mt-2" />
      {/*<div className="flex justify-end gap-2 pr-4">*/}
      {/*  <CourtCountSelector />*/}
      {/*</div>*/}

      <div className="overflow-y-auto pt-4 pl-4 h-full">
        {courts.map((court, courtIdx) => {
          const match = court.matchId ? getById(court.matchId) : null
          const isOngoing = match?.status === 'ongoing'

          return (
            <Fragment key={court.id}>
              <div className="pr-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-1 items-end-safe">
                    <p className="text-lg font-semibold leading-tight">Quadra {courtIdx + 1}</p>
                    {court.autoAlternate && (
                      <p className="text-sm text-muted-foreground leading-tight">
                        alternada ({translateFormationMode(match?.formationMode ?? court.formationMode)})
                      </p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem variant="destructive" onSelect={() => handleDeleteCourt(court.id)}>
                        <TrashIcon className="h-4 w-4" /> Remover quadra {isOngoing && 'e partida'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {match ? (
                  <MatchCard key={match.id} match={match} />
                ) : (
                  <p className="text-sm text-muted-foreground leading-tight text-center mt-4">
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
                      {/*<span className="text-sm text-muted-foreground font-normal">({balanceLabel})</span>*/}
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

        <Button>Adicionar quadra</Button>
      </div>
    </div>
  )
}
