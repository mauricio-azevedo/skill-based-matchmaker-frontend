import { type FC, useEffect, useRef, useState } from 'react'

import { usePlayers } from '@/context/PlayersContext'
import { useRounds } from '@/context/RoundsContext'
import { generateSchedule } from '@/lib/algorithm'
import type { Player, UnsavedRound } from '@/types/players'

// shadcn/ui
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { Crown, Edit, MoreVertical, Shuffle, Trash, X } from 'lucide-react'
import { useCourts } from '@/context/CourtsContext'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AnimatePresence, motion } from 'framer-motion'
import { itemVariants } from '@/consts/animation'
import { singleToastError, singleToastSuccess, singleToastWarn } from '@/utils/singleToast'
import { ConfirmDialog } from '@/components/ConfirmDialog'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const PLAYERS_PER_MATCH = 4 as const
const SCORE_OPTIONS = [0, 1, 2, 3, 4, 5, 6] as const
const DISABLE_SNAP_TIMEOUT = 800 as const

// -----------------------------------------------------------------------------
// Utility helpers
// -----------------------------------------------------------------------------
/**
 * Apply (or revert) the statistics of a given round to the players array.
 * @param players Current players array.
 * @param round   Round whose stats will be applied.
 * @param factor  +1 to add stats, -1 to remove.
 */
function applyRoundStats(players: Player[], round: ReturnType<typeof generateSchedule>, factor: 1 | -1): Player[] {
  return players.map((player) => {
    let deltaMatches = 0
    const updatedPartners: Record<string, number> = { ...player.partnerCounts }

    round.matches.forEach(({ teamA, teamB }) => {
      const [a1, a2] = teamA
      if (player.id === a1.id || player.id === a2.id) {
        deltaMatches += 1
        const partnerId = player.id === a1.id ? a2.id : a1.id
        updatedPartners[partnerId] = (updatedPartners[partnerId] || 0) + factor
        if (updatedPartners[partnerId] <= 0) delete updatedPartners[partnerId]
      }

      const [b1, b2] = teamB
      if (player.id === b1.id || player.id === b2.id) {
        deltaMatches += 1
        const partnerId = player.id === b1.id ? b2.id : b1.id
        updatedPartners[partnerId] = (updatedPartners[partnerId] || 0) + factor
        if (updatedPartners[partnerId] <= 0) delete updatedPartners[partnerId]
      }
    })

    return {
      ...player,
      matchCount: Math.max(0, player.matchCount + deltaMatches * factor),
      partnerCounts: updatedPartners,
    }
  })
}

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------
const MatchesTab: FC = () => {
  const { players, updatePlayers } = usePlayers()
  const { rounds, addRound, setGames, replaceRound, removeRound } = useRounds()
  const { courts } = useCourts()

  const activePlayers = players.filter((p) => p.active)

  // Ref for scroll container
  const listRef = useRef<HTMLUListElement>(null)
  const [disableSnap, setDisableSnap] = useState(false)

  const [modalState, setModalState] = useState<{
    open: boolean
    matchId: string | null
    roundIdx: number | null
    initialA: number | null
    initialB: number | null
    namesA: string[]
    namesB: string[]
  }>({
    open: false,
    matchId: null,
    roundIdx: null,
    initialA: null,
    initialB: null,
    namesA: [],
    namesB: [],
  })

  const [confirmShuffle, setConfirmShuffle] = useState<{ open: boolean; roundIndex: number | null }>({
    open: false,
    roundIndex: null,
  })
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; roundIndex: number | null }>({
    open: false,
    roundIndex: null,
  })

  const hasScoresInRound = (idx: number | null) =>
    idx !== null && rounds[idx]?.matches.some((m) => m.gamesA !== null || m.gamesB !== null)

  const hasEnoughForCourts = (plist: Player[], courts: number) =>
    plist.filter((p) => p.active).length >= courts * PLAYERS_PER_MATCH

  // Extracted generation logic
  const generateNewRound = () => {
    if (warnIfInsufficient()) return
    setDisableSnap(true)
    try {
      const newRound: UnsavedRound = generateSchedule(activePlayers, courts)
      addRound(newRound)
      updatePlayers((prev) => applyRoundStats(prev, newRound, 1))
      singleToastSuccess(`Rodada #${rounds.length + 1} gerada!`, { duration: 3000 })
    } catch (error) {
      singleToastError((error as Error).message, { duration: 6000 })
    }
  }

  // Handle generate click: scroll to top if needed
  const handleGenerate = () => {
    if (listRef.current && listRef.current.scrollTop > 0) {
      listRef.current.scrollTo({ top: 0, behavior: 'smooth' })
    }
    generateNewRound()
  }

  // Re-enable snap after rounds update
  useEffect(() => {
    if (!disableSnap) return
    const timer = setTimeout(() => setDisableSnap(false), DISABLE_SNAP_TIMEOUT)
    return () => clearTimeout(timer)
  }, [rounds, disableSnap])

  const doShuffle = (idx: number) => {
    const oldRound = rounds[idx]
    if (!oldRound) return
    const cleanedPlayers = applyRoundStats(activePlayers, oldRound, -1)
    const fresh: UnsavedRound = generateSchedule(cleanedPlayers, courts)
    const newRound = { ...fresh, id: oldRound.id, roundNumber: oldRound.roundNumber }
    updatePlayers((prev) => {
      const cleaned = applyRoundStats(prev, oldRound, -1)
      return applyRoundStats(cleaned, newRound, 1)
    })
    replaceRound(idx, newRound)
    singleToastSuccess(`Rodada ${oldRound.roundNumber} embaralhada!`, { duration: 3000 })
  }

  const doDelete = (idx: number) => {
    const roundToRemove = rounds[idx]
    if (!roundToRemove) return

    // turn snap off immediately before removing
    setDisableSnap(true)
    updatePlayers((prev) => applyRoundStats(prev, roundToRemove, -1))
    removeRound(idx)
    singleToastSuccess(`Rodada #${roundToRemove.roundNumber} excluída!`, { duration: 3000 })
  }

  const openScoreModalFor = (matchId: string, idx: number) => {
    const match = rounds[idx]?.matches.find((m) => m.id === matchId)
    if (!match) return
    setModalState({
      open: true,
      matchId,
      roundIdx: idx,
      initialA: match.gamesA ?? null,
      initialB: match.gamesB ?? null,
      namesA: match.teamA.map((p) => p.name),
      namesB: match.teamB.map((p) => p.name),
    })
  }

  const handleSaveScore = (scoreA: number, scoreB: number) => {
    if (modalState.roundIdx === null || !modalState.matchId) return
    setGames(modalState.roundIdx, modalState.matchId, 'A', scoreA)
    setGames(modalState.roundIdx, modalState.matchId, 'B', scoreB)
    setModalState((prev) => ({ ...prev, open: false }))
    singleToastSuccess('Placar salvo!', { duration: 3000 })
  }

  const warnIfInsufficient = (): boolean => {
    if (!hasEnoughForCourts(players, courts)) {
      singleToastWarn(
        `Precisamos de pelo menos ${courts * PLAYERS_PER_MATCH} jogadores ativos para preencher ${courts} ${
          courts === 1 ? 'quadra' : 'quadras'
        }`,
      )
      return true
    }
    return false
  }

  return (
    <>
      <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight self-start mb-2">Partidas</h3>
      <div className="!gap-2 relative flex flex-col justify-between overflow-hidden w-full">
        {/* Empty State */}
        <AnimatePresence initial={false}>
          {rounds.length === 0 && (
            <motion.div
              key="no-rounds"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex top-0 left-4 pointer-events-none"
            >
              <p className="italic text-muted-foreground">Nenhuma rodada gerada ainda.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rounds List */}
        <ul
          ref={listRef}
          className={cn('overflow-y-auto h-full', disableSnap ? 'snap-none' : 'snap-y snap-mandatory', 'shadow-inner')}
        >
          <AnimatePresence initial={false}>
            {rounds.map((round, idx) => (
              <motion.li
                key={round.id}
                layout="position"
                variants={itemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col gap-6 pb-12 snap-start"
              >
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Rodada {round.roundNumber}</h4>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="shrink-0">
                            <MoreVertical className="w-4 h-4" aria-label="Mais opções" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              if (warnIfInsufficient()) return
                              setConfirmShuffle({ open: true, roundIndex: idx })
                            }}
                          >
                            <Shuffle size={14} aria-hidden="true" /> Embaralhar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => {
                              setConfirmDelete({ open: true, roundIndex: idx })
                            }}
                          >
                            <Trash size={14} aria-hidden="true" /> Apagar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <ol className="flex flex-col gap-10 flex-1">
                      {round.matches.map((m) => {
                        const hasScore = m.gamesA !== null && m.gamesB !== null
                        return (
                          <li key={m.id} className="rounded-2xl border bg-muted px-3 py-4 shadow-sm flex-1 relative">
                            <div className="flex flex-1 items-center gap-4">
                              <TeamView players={m.teamA} isWinner={m.winner === 'A'} team={'A'} />
                              <div className="flex flex-col items-center gap-1">
                                <div className="absolute -top-1/4 items-center flex">
                                  <Button
                                    className="border"
                                    size="sm"
                                    variant="secondary"
                                    onClick={() => openScoreModalFor(m.id, idx)}
                                  >
                                    {!hasScore ? (
                                      <>
                                        <Edit size={8} />
                                        <span className="text-xs">Resultado</span>
                                      </>
                                    ) : (
                                      <>
                                        {m.gamesA} × {m.gamesB}
                                      </>
                                    )}
                                  </Button>
                                </div>
                                <X size={14} />
                              </div>
                              <TeamView players={m.teamB} isWinner={m.winner === 'B'} team={'B'} />
                            </div>
                          </li>
                        )
                      })}
                    </ol>
                  </CardContent>
                </Card>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      <div className="p-2">
        <Button className="flex-1" onClick={handleGenerate} disabled={players.length < PLAYERS_PER_MATCH}>
          Nova rodada
        </Button>
      </div>
      {/* Confirm shuffle dialog */}
      <ConfirmDialog
        open={confirmShuffle.open}
        onOpenChange={(open) => setConfirmShuffle((p) => ({ ...p, open }))}
        title={
          hasScoresInRound(confirmShuffle.roundIndex) ? 'Descartar resultados e embaralhar?' : 'Embaralhar esta rodada?'
        }
        description={
          hasScoresInRound(confirmShuffle.roundIndex)
            ? 'Há resultados salvos. Eles serão perdidos permanentemente. Confirme que quer sobrescrever esta rodada.'
            : 'Confirme que os jogos ainda não começaram.'
        }
        onConfirm={() => {
          if (confirmShuffle.roundIndex !== null) {
            doShuffle(confirmShuffle.roundIndex)
            setConfirmShuffle({ open: false, roundIndex: null })
          }
        }}
        confirmText="Sim, embaralhar"
        cancelText="Cancelar"
      />
      {/* Confirm delete dialog */}
      <ConfirmDialog
        open={confirmDelete.open}
        onOpenChange={(open) => setConfirmDelete((p) => ({ ...p, open }))}
        title={
          hasScoresInRound(confirmDelete.roundIndex) ? 'Excluir rodada e descartar resultados?' : 'Excluir esta rodada?'
        }
        description={
          hasScoresInRound(confirmDelete.roundIndex)
            ? 'Há resultados salvos. Eles serão perdidos permanentemente.'
            : 'Esta ação é irreversível.'
        }
        onConfirm={() => {
          if (confirmDelete.roundIndex !== null) {
            doDelete(confirmDelete.roundIndex)
            setConfirmDelete({ open: false, roundIndex: null })
          }
        }}
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        confirmVariant="destructive"
      />
      <ScoreModal
        key={modalState.matchId || ''}
        open={modalState.open}
        onClose={() => setModalState((p) => ({ ...p, open: false }))}
        initialScoreA={modalState.initialA}
        initialScoreB={modalState.initialB}
        namesA={modalState.namesA}
        namesB={modalState.namesB}
        onSave={handleSaveScore}
      />
    </>
  )
}

// -----------------------------------------------------------------------------
// TeamView sub-component
// -----------------------------------------------------------------------------
interface TeamViewProps {
  players: Player[]
  isWinner: boolean
  team: 'A' | 'B'
}

const TeamView: FC<TeamViewProps> = ({ players, isWinner, team }) => (
  <div className={cn('flex flex-1 items-center gap-4 justify-end', team === 'A' && 'justify-end flex-row-reverse')}>
    {isWinner && (
      <div>
        <Crown
          className={cn('h-4 w-4 text-yellow-500', team === 'B' ? 'self-end' : 'self-start')}
          aria-label="Winner"
        />
      </div>
    )}
    <div className="flex flex-col max-w-full gap-1">
      {players.map((p) => (
        <div key={p.id} className={cn('flex items-end gap-2 text-base', team === 'B' && 'justify-end')}>
          <p className="text-sm font-medium">{p.name}</p>
        </div>
      ))}
    </div>
  </div>
)

// -----------------------------------------------------------------------------
// ScoreModal sub-component (handles its own local state for robustness)
// -----------------------------------------------------------------------------
interface ScoreModalProps {
  open: boolean
  onClose: () => void
  initialScoreA: number | null
  initialScoreB: number | null
  namesA: string[]
  namesB: string[]
  onSave: (scoreA: number, scoreB: number) => void
}

const ScoreModal: FC<ScoreModalProps> = ({ open, onClose, initialScoreA, initialScoreB, namesA, namesB, onSave }) => {
  const [scoreA, setScoreA] = useState<number | null>(initialScoreA)
  const [scoreB, setScoreB] = useState<number | null>(initialScoreB)

  useEffect(() => {
    setScoreA(initialScoreA)
    setScoreB(initialScoreB)
  }, [initialScoreA, initialScoreB])

  const renderScoreToggle = (value: number | null, onChange: (v: number) => void) => (
    <ToggleGroup
      type="single"
      value={value !== null ? String(value) : ''}
      onValueChange={(val) => {
        if (!val) return
        onChange(Number(val))
      }}
      className="grid grid-cols-7 gap-1 w-full"
    >
      {SCORE_OPTIONS.map((opt) => (
        <ToggleGroupItem key={opt} value={String(opt)} className="px-2 py-1">
          {opt}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )

  const handleSave = () => {
    if (scoreA === null || scoreB === null) {
      singleToastError('Selecione o placar de ambos os times.')
      return
    }
    onSave(scoreA, scoreB)
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inserir resultado</DialogTitle>
        </DialogHeader>

        {/* ---------- Nomes das duplas ---------- */}
        <div className="flex flex-col gap-6">
          <div>
            <p className="font-semibold mb-3">{namesA.join(' & ')}</p>
            {renderScoreToggle(scoreA, setScoreA)}
          </div>
          <div>
            <p className="font-semibold mb-3">{namesB.join(' & ')}</p>
            {renderScoreToggle(scoreB, setScoreB)}
          </div>
        </div>

        {/* ---------- Botões ---------- */}
        <DialogFooter>
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>Salvar</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default MatchesTab
