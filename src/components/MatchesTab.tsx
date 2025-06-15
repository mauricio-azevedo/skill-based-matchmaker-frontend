import { type FC, useEffect, useRef, useState } from 'react'

import { usePlayers } from '@/context/PlayersContext'
import { useRounds } from '@/context/RoundsContext'
import { generateSchedule } from '@/lib/algorithm'
import type { Player } from '@/types/players'

// shadcn/ui
import { toast } from 'sonner'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'
import { Crown, Edit, MoreVertical, Shuffle, Trash, X } from 'lucide-react'
import { useCourts } from '@/context/CourtsContext'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AnimatePresence, LayoutGroup, motion } from 'framer-motion'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const PLAYERS_PER_MATCH = 4 as const
const SCORE_OPTIONS = [0, 1, 2, 3, 4, 5, 6] as const

// -----------------------------------------------------------------------------
// Utility helpers
// -----------------------------------------------------------------------------
/**
 * Apply (or revert) the statistics of a given round to the players array.
 * @param players Current players array.
 * @param round   Round whose stats will be applied.
 * @param factor  +1 to add stats, -1 to remove.
 */
function applyRoundStats(players: Player[], round: ReturnType<typeof generateSchedule>, factor: 1 | -1) {
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

  // Sync whenever the selected match changes
  useEffect(() => {
    setScoreA(initialScoreA)
    setScoreB(initialScoreB)
  }, [initialScoreA, initialScoreB])

  const renderScoreToggle = (value: number | null, onChange: (v: number) => void) => (
    <ToggleGroup
      type="single"
      /* antes: undefined => “uncontrolled”  */
      value={value !== null ? String(value) : ''} // <= string vazia zera o estado
      onValueChange={(val) => {
        if (!val) return // val === '' quando o user desmarca
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
      toast.error('Selecione o placar de ambos os times.')
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

const roundVariants = {
  initial: { opacity: 0, scale: 0.9, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.8, y: 12 },
}
const spring = { type: 'spring', stiffness: 500, damping: 38, mass: 0.9 }

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------
const MatchesTab: FC = () => {
  const { players, updatePlayers } = usePlayers()
  const { rounds, addRound, setGames, replaceRound, removeRound } = useRounds()
  const { courts } = useCourts()

  const activePlayers = players.filter((p) => p.active)

  const hasAutoGenerated = useRef(false)

  const selectedRoundRef = useRef<HTMLDivElement | null>(null)

  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number>(0)

  // Modal state consolidated for robustness
  const [modalState, setModalState] = useState<{
    open: boolean
    matchId: string | null
    roundIdxUI: number | null
    initialA: number | null
    initialB: number | null
    namesA: string[]
    namesB: string[]
  }>({
    open: false,
    matchId: null,
    roundIdxUI: null,
    initialA: null,
    initialB: null,
    namesA: [],
    namesB: [],
  })

  // Confirmation dialog state – shuffle
  const [confirmShuffle, setConfirmShuffle] = useState<{
    open: boolean
    roundIndex: number | null
  }>({ open: false, roundIndex: null })

  // NEW: Confirmation dialog state – delete
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean
    roundIndex: number | null
  }>({ open: false, roundIndex: null })

  const uiToInternal = (uiIdx: number) => rounds.length - 1 - uiIdx

  const hasScoresInRound = (idx: number | null) =>
    idx !== null && rounds[idx]?.matches.some((m) => m.gamesA !== null || m.gamesB !== null)

  const hasEnoughForCourts = (plist: Player[], courts: number) =>
    plist.filter((p) => p.active).length >= courts * PLAYERS_PER_MATCH

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!selectedRoundRef.current) return
    const id = requestAnimationFrame(() =>
      selectedRoundRef.current!.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' }),
    )
    return () => cancelAnimationFrame(id)
  }, [selectedRoundIndex, rounds.length])

  useEffect(() => {
    if (!hasAutoGenerated.current) {
      hasAutoGenerated.current = true
      // Só gera se ainda não houver nenhuma rodada
      if (rounds.length === 0) {
        handleGenerate()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // ao adicionar, selecione sempre a última existente
    if (rounds.length === 0) {
      setSelectedRoundIndex(0)
    } else if (selectedRoundIndex >= rounds.length) {
      setSelectedRoundIndex(rounds.length - 1)
    }
  }, [rounds])

  // ---------------------------------------------------------------------------
  // Handlers – Generation / Shuffle / Delete / Clear
  // ---------------------------------------------------------------------------
  const handleGenerate = () => {
    if (warnIfInsufficient()) return

    try {
      const newRound = generateSchedule(activePlayers, courts)
      addRound(newRound)
      setSelectedRoundIndex(0)
      updatePlayers((prev) => applyRoundStats(prev, newRound, 1))
      toast.success(`Rodada #${rounds.length + 1} gerada!`, {
        duration: 3000,
      })
    } catch (error) {
      toast.error((error as Error).message, {
        duration: 6000,
      })
    }
  }

  /**
   * *Actual* shuffle logic extracted so we can call it after confirmation.
   */
  const doShuffle = (uiIdx: number) => {
    // ① rodada correta, olhando o array que a UI usa (já invertido)
    const oldRound = rounds[uiIdx]
    if (!oldRound) return

    // ② índice correspondente no array ascendente, usado pelo context
    const ascIdx = uiToInternal(uiIdx)

    // ③ gera novo schedule e preserva o id para manter a key estável
    const fresh = generateSchedule(activePlayers, courts)
    const newRound = { ...fresh, id: oldRound.id }

    // ④ atualiza estatísticas
    updatePlayers((prev) => applyRoundStats(prev, oldRound, -1))
    updatePlayers((prev) => applyRoundStats(prev, newRound, 1))

    // ⑤ troca no contexto (RoundsProvider)
    replaceRound(ascIdx, newRound)

    toast.success('Rodada embaralhada!', { duration: 3000 })
  }

  /**
   * *Actual* delete logic extracted so we can call it after confirmation.
   */
  const doDelete = (targetIdxUI: number) => {
    const targetInternal = uiToInternal(targetIdxUI)
    const roundToRemove = rounds[targetInternal]
    if (!roundToRemove) return

    // 1. devolve os stats dessa rodada
    updatePlayers((prev) => applyRoundStats(prev, roundToRemove, -1))

    // 2. remove a rodada numa tacada só
    removeRound(targetInternal) // crie no seu contexto ou use setRounds

    // 3. ajusta seleção
    setSelectedRoundIndex((i) => Math.max(0, i > targetIdxUI ? i - 1 : i))
    toast.success('Rodada excluída!', { duration: 3000 })
  }

  // ---------------------------------------------------------------------------
  // Handlers – Scores
  // ---------------------------------------------------------------------------
  const openScoreModalFor = (matchId: string, roundIdxUI: number) => {
    const match = rounds.flatMap((r) => r.matches).find((m) => m.id === matchId)
    if (!match) return

    setModalState({
      open: true,
      matchId,
      roundIdxUI,
      initialA: match.gamesA ?? null,
      initialB: match.gamesB ?? null,
      namesA: match.teamA.map((p) => p.name),
      namesB: match.teamB.map((p) => p.name),
    })
  }

  const handleSaveScore = (scoreA: number, scoreB: number) => {
    if (!modalState.matchId || modalState.roundIdxUI === null) return

    const idxInternal = uiToInternal(modalState.roundIdxUI)
    setGames(idxInternal, modalState.matchId, 'A', scoreA)
    setGames(idxInternal, modalState.matchId, 'B', scoreB)
    setModalState((prev) => ({ ...prev, open: false }))
    toast.success('Placar salvo!', { duration: 2500 })
  }

  const warnIfInsufficient = (): boolean => {
    if (!hasEnoughForCourts(players, courts)) {
      toast.error(
        `Precisamos de pelo menos ${courts * PLAYERS_PER_MATCH} jogadores ativos para preencher ${courts} ${
          courts === 1 ? 'quadra' : 'quadras'
        }.`,
      )
      return true
    }

    return false
  }

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------
  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Confirmation dialog for shuffling with existing results            */}
      {/* ------------------------------------------------------------------ */}

      {confirmShuffle.open && (
        <Dialog
          open={confirmShuffle.open}
          onOpenChange={(isOpen) => setConfirmShuffle((p) => ({ ...p, open: isOpen }))}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {hasScoresInRound(confirmShuffle.roundIndex)
                  ? 'Descartar resultados e embaralhar?'
                  : 'Embaralhar esta rodada?'}
              </DialogTitle>
            </DialogHeader>

            <p className="text-sm">
              {hasScoresInRound(confirmShuffle.roundIndex)
                ? 'Há resultados salvos. Eles serão perdidos permanentemente. Confirme que quer sobrescrever esta rodada.'
                : 'Confirme que os jogos ainda não começaram.'}
            </p>

            <DialogFooter className="pt-4">
              <Button variant="secondary" onClick={() => setConfirmShuffle({ open: false, roundIndex: null })}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirmShuffle.roundIndex === null) return
                  setConfirmShuffle({ open: false, roundIndex: null })
                  doShuffle(confirmShuffle.roundIndex)
                }}
              >
                Sim, embaralhar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {confirmDelete.open && (
        <Dialog open={confirmDelete.open} onOpenChange={(isOpen) => setConfirmDelete((p) => ({ ...p, open: isOpen }))}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {hasScoresInRound(confirmDelete.roundIndex)
                  ? 'Excluir rodada e descartar resultados?'
                  : 'Excluir esta rodada?'}
              </DialogTitle>
            </DialogHeader>

            <p className="text-sm">
              {hasScoresInRound(confirmDelete.roundIndex)
                ? 'Há resultados salvos. Eles serão perdidos permanentemente.'
                : 'Esta ação é irreversível.'}
            </p>

            <DialogFooter className="pt-4">
              <Button variant="secondary" onClick={() => setConfirmDelete({ open: false, roundIndex: null })}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (confirmDelete.roundIndex === null) return
                  setConfirmDelete({ open: false, roundIndex: null })
                  doDelete(confirmDelete.roundIndex)
                }}
              >
                Sim, excluir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal para inserir placar */}
      <ScoreModal
        key={modalState.matchId} // força unmount/mount ao trocar de partida
        open={modalState.open}
        onClose={() => setModalState((p) => ({ ...p, open: false }))}
        initialScoreA={modalState.initialA}
        initialScoreB={modalState.initialB}
        namesA={modalState.namesA}
        namesB={modalState.namesB}
        onSave={handleSaveScore}
      />

      <Card>
        {/* ----------------------------- Header ----------------------------- */}
        <CardHeader>
          <CardTitle>Partidas</CardTitle>
        </CardHeader>

        <CardContent className="!gap-2">
          {/* ------------------------ Controls ----------------------- */}
          {/* Seleção de rodadas (desabilitada por enquanto) */}

          {/* ---------------------- Rounds list ---------------------- */}
          <div className="h-full w-full flex flex-col gap-2 overflow-y-auto snap-y snap-mandatory shadow-[inset_0_-12px_10px_-12px_rgba(0,0,0,0.35)]">
            {rounds.length === 0 && (
              <p
                key="placeholder" // chave p/ AnimatePresence poder animar
                className="italic text-muted-foreground"
              >
                Nenhuma rodada gerada ainda.
              </p>
            )}

            <LayoutGroup>
              <AnimatePresence>
                {rounds.map((round, idx) => (
                  <motion.div
                    key={round.id}
                    layout="position" // ✔ transições suaves no layout
                    variants={roundVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={spring}
                    ref={idx === selectedRoundIndex ? selectedRoundRef : undefined}
                    className="flex flex-col gap-6 snap-start pb-12"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h2 className="border-l-4 border-primary pl-3 text-xl font-bold">Rodada {rounds.length - idx}</h2>

                      {/* botão “mais opções” */}
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
                            {/* Times + placar */}
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
                  </motion.div>
                ))}
              </AnimatePresence>
            </LayoutGroup>
          </div>
        </CardContent>
        <CardFooter>
          <Button className="flex-1" onClick={handleGenerate} disabled={players.length < PLAYERS_PER_MATCH}>
            Nova rodada
          </Button>
        </CardFooter>
      </Card>
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
    {/* crown replaces the old green ring */}
    {isWinner && (
      <div>
        <Crown
          className={cn(
            'h-4 w-4 text-yellow-500', // size + brand-friendly color
            team === 'B' ? 'self-end' : 'self-start',
          )}
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

export default MatchesTab
