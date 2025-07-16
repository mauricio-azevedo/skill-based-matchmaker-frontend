import { useCallback, useState } from 'react'
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
import { AnimatePresence, motion } from 'framer-motion'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export function PlayTab() {
  const { courts } = useCourts()
  const { generateAndStartMatch } = useMatchManager()
  const { getById, matches } = useMatches()
  const { removeCourtsAndMatches, addCourtWithMatch } = useCourtMatches()

  // State for confirm dialog
  const [pendingDelete, setPendingDelete] = useState<{
    courtId: string
    hasOngoingMatch: boolean
  } | null>(null)

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

  // Replace window.confirm: trigger our ConfirmDialog
  const handleDeleteCourt = useCallback((courtId: string, hasOngoingMatch: boolean) => {
    setPendingDelete({ courtId, hasOngoingMatch })
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDelete) return
    removeCourtsAndMatches([pendingDelete.courtId], courts.length - 1)
    setPendingDelete(null)
  }, [pendingDelete, removeCourtsAndMatches, courts.length])

  const handleCancelDelete = useCallback(() => {
    setPendingDelete(null)
  }, [])

  return (
    <div className="w-full flex flex-col overflow-hidden h-full relative">
      <h2 className="text-lg font-semibold leading-tight m-0 text-center">Partidas</h2>
      <Separator className="mt-2" />

      {courts.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Nenhuma quadra adicionada ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col items-center overflow-y-auto overscroll-y-contain pt-4 pb-14 pl-4 h-full">
          {/* AnimatePresence wraps the list to animate court add/remove */}
          <AnimatePresence initial={false} mode="popLayout">
            {courts.map((court, courtIdx) => {
              const match = court.matchId ? getById(court.matchId) : null
              const hasOngoingMatch = match?.status === 'ongoing'
              const matchNumber: number = matches.findIndex((m) => m.id === match?.id) + 1

              return (
                <motion.div
                  key={court.id}
                  layout
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="w-full"
                >
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

                    {/* Animação de fade in/out para conteúdo da partida */}
                    <AnimatePresence initial={false} mode="wait">
                      {match ? (
                        <motion.div
                          key={`match-${match.id}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="mt-2 flex flex-col gap-2"
                        >
                          <p className="text-sm font-normal leading-tight">
                            Partida {matchNumber}{' '}
                            <span className="text-xs font-light text-muted-foreground leading-tight">
                              {translateFormationMode(match.formationMode)}
                            </span>
                          </p>
                          <MatchCard key={match.id} match={match} />
                        </motion.div>
                      ) : (
                        <motion.p
                          key={`no-match-${court.id}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0 }}
                          className="text-sm text-muted-foreground leading-tight text-center mt-4"
                        >
                          Nenhuma partida ainda.
                        </motion.p>
                      )}
                    </AnimatePresence>

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
                            className="rounded-r-md rounded-l-none border-l !border-border !ring-0"
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
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <div className="absolute bottom-4 right-4 shadow-2xl">
        <Button size="sm" onClick={() => addCourtWithMatch()}>
          Adicionar quadra
        </Button>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) handleCancelDelete()
        }}
        title={
          pendingDelete?.hasOngoingMatch
            ? 'Remover quadra e partida?' // título condicional
            : 'Remover quadra?'
        }
        description={
          pendingDelete?.hasOngoingMatch
            ? 'Deseja realmente remover essa quadra e suas partidas associadas?'
            : 'Deseja realmente remover essa quadra?'
        }
        confirmText="Remover"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        confirmVariant="destructive"
      />
    </div>
  )
}
