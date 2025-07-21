import { useCallback, useState } from 'react'
import { MatchCard } from '@/components/MatchCard'
import { useCourts } from '@/context/CourtsContext'
import { useMatchManager } from '@/hooks/useMatchManager'
import { useMatches } from '@/context/MatchesContext'
import { Separator } from '@/components/ui/separator'
import { CourtSettings } from '@/components/CourtSettings'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { EditIcon, MoreVertical, ShuffleIcon, TrashIcon } from 'lucide-react'
import { useCourtMatches } from '@/hooks/useCourtMatches'
import { translateFormationMode } from '@/lib/formationModes'
import { AnimatePresence, motion } from 'framer-motion'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EditMatchPlayersDialog } from '@/components/EditMatchPlayersDialog'

export function PlayTab() {
  const { courts } = useCourts()
  const { generateAndStartMatch } = useMatchManager()
  const { getById, matches } = useMatches()
  const { removeCourtAndMatch, addCourtWithMatch } = useCourtMatches()

  const [pendingDelete, setPendingDelete] = useState<{
    courtId: string
    courtNumber: number
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

  /**
   * Delete a court immediately if there's no ongoing match,
   * otherwise show confirmation dialog.
   */
  const handleDeleteCourt = useCallback(
    (courtId: string, hasOngoing: boolean, courtNumber: number) => {
      if (hasOngoing) {
        setPendingDelete({ courtId, courtNumber })
      } else {
        removeCourtAndMatch(courtId)
      }
    },
    [removeCourtAndMatch],
  )

  const handleConfirmDelete = useCallback(() => {
    if (!pendingDelete) return
    removeCourtAndMatch(pendingDelete.courtId)
    setPendingDelete(null)
  }, [pendingDelete, removeCourtAndMatch])

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
              const courtNumber = courtIdx + 1

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
                      <div className="flex gap-1 items-center">
                        <p className="text-lg font-semibold leading-tight">Quadra {courtNumber}</p>
                        <CourtSettings courtId={court.id} />
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
                            onSelect={() => handleDeleteCourt(court.id, hasOngoingMatch, courtNumber)}
                          >
                            <TrashIcon className="h-4 w-4" /> Apagar quadra
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

                    <div className="w-full mt-4 flex items-center gap-1">
                      <Button variant="secondary" size="icon" disabled={!hasOngoingMatch}>
                        <ShuffleIcon />
                      </Button>

                      {hasOngoingMatch ? (
                        <EditMatchPlayersDialog key={match.id} match={match} />
                      ) : (
                        <Button variant="secondary" size="icon" disabled>
                          <EditIcon />
                        </Button>
                      )}

                      <Button
                        className="flex-1"
                        variant="default"
                        disabled={hasOngoingMatch}
                        onClick={() => handleStart(court.id)}
                      >
                        <p className="leading-tight">Gerar nova partida</p>
                      </Button>
                    </div>
                  </div>
                  <Separator className="mt-6 mb-4" />
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}

      <div className="absolute bottom-4 right-4 shadow-2xl z-20">
        <Button size="sm" onClick={() => addCourtWithMatch()}>
          Adicionar quadra
        </Button>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => {
          if (!open) handleCancelDelete()
        }}
        title={`Apagar quadra ${pendingDelete?.courtNumber}?`}
        description="A quadra e a partida em andamento serão permanentemente apagadas. Deseja continuar?"
        confirmText="Apagar quadra"
        cancelText="Cancelar"
        onConfirm={handleConfirmDelete}
        confirmVariant="destructive"
      />
    </div>
  )
}
