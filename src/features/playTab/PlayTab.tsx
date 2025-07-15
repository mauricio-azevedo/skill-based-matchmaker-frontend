import { useCallback } from 'react'
import { MatchCard } from '@/components/MatchCard'
import { useCourts } from '@/context/CourtsContext'
import { useMatchManager } from '@/hooks/useMatchManager'
import { useMatches } from '@/context/MatchesContext'
import { Separator } from '@/components/ui/separator'
import { CourtSettings } from '@/components/CourtSettings'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { ChevronDownIcon, MoreVertical, TrashIcon } from 'lucide-react'
import { useCourtMatches } from '@/hooks/useCourtMatches'
import { getNextFormationMode, translateFormationMode } from '@/lib/formationModes'

export function PlayTab() {
  const { courts } = useCourts()
  const { generateAndStartMatch } = useMatchManager()
  const { getById, matches } = useMatches()
  const { removeCourtsAndMatches, addCourtWithMatch } = useCourtMatches()

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
    (courtId: string, hasOngoingMatch: boolean) => {
      if (hasOngoingMatch) {
        if (confirm('Deseja realmente remover essa quadra e suas partidas associadas?')) {
          removeCourtsAndMatches([courtId], courts.length - 1)
        }
      } else {
        removeCourtsAndMatches([courtId], courts.length - 1)
      }
    },
    [removeCourtsAndMatches, courts.length],
  )

  return (
    <div className="w-full flex flex-col overflow-hidden h-full relative">
      <div className="flex justify-between items-center gap-2">
        <h2 className="text-lg font-semibold leading-tight m-0 text-center w-full">Partidas</h2>
      </div>
      <Separator className="mt-2" />

      <div className="flex flex-col items-center overflow-y-auto pt-4 pb-14 pl-4 h-full">
        {courts.map((court, courtIdx) => {
          const match = court.matchId ? getById(court.matchId) : null
          const hasOngoingMatch = match?.status === 'ongoing'
          const matchNumber: number = matches.findIndex((m) => m.id === match?.id) + 1

          console.log({ court: court.id, match: match?.id, matchNumber, matches: matches.length })

          return (
            <div className="w-full" key={court.id}>
              <div className="pr-4">
                <div className="flex justify-between items-center">
                  <div className="flex gap-1 items-end-safe">
                    <p className="text-lg font-semibold leading-tight">Quadra {courtIdx + 1}</p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <MoreVertical />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        variant="destructive"
                        onSelect={() => handleDeleteCourt(court.id, hasOngoingMatch)}
                      >
                        <TrashIcon className="h-4 w-4" /> Remover quadra {hasOngoingMatch && 'e partida'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {match ? (
                  <div className="mt-2 flex flex-col gap-2" key={match.id}>
                    <p className="text-sm font-normal leading-tight">
                      Partida {matchNumber}{' '}
                      <span className="text-xs font-light text-muted-foreground leading-tight">
                        {translateFormationMode(match.formationMode)}
                      </span>
                    </p>
                    <MatchCard key={match.id} match={match} />
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground leading-tight text-center mt-4">Nenhuma partida ainda.</p>
                )}

                <div className="w-full mt-4 flex items-center">
                  <Button
                    variant="secondary"
                    disabled={hasOngoingMatch}
                    onClick={() => handleStart(court.id)}
                    className="rounded-l-md rounded-r-none flex-1 px-2"
                  >
                    <p className="leading-tight">
                      <span>Gerar nova partida</span>{' '}
                      <span className="text-xs text-muted-foreground font-normal leading-tight">
                        ({getNextFormationMode(court.formationMode, court.autoAlternate)})
                      </span>
                    </p>
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="secondary"
                        aria-label="Options"
                        className="rounded-r-md rounded-l-none border-l !border-l-[#fffff26] !ring-0 !ring-offset-0 focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 focus:ring-offset-0 focus-visible:ring-offset-0"
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
                      <CourtSettings courtId={court.id} />
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              <Separator className="mt-6 mb-4" />
            </div>
          )
        })}

        {courts.length === 0 && (
          <div className="h-full flex items-center justify-center pr-4">
            <p className="text-sm text-muted-foreground">Nenhuma quadra adicionada ainda.</p>
          </div>
        )}

        <div className="absolute bottom-4 right-4 shadow-2xl">
          <Button size="sm" onClick={() => addCourtWithMatch()}>
            Adicionar quadra
          </Button>
        </div>
      </div>
    </div>
  )
}
