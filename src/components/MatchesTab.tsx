import React, { type FC, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { usePlayers } from '@/context/PlayersContext'
import { useRounds } from '@/context/RoundsContext'
import { generateSchedule } from '@/lib/algorithm'
import type { Player, Round, UnsavedRound } from '@/types/players'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Crown, MoreVertical, Shuffle, Trash, X } from 'lucide-react'
import { type FormationMode, useCourts } from '@/context/CourtsContext'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AnimatePresence, motion } from 'framer-motion'
import { itemVariants } from '@/consts/animation'
import { singleToastError, singleToastSuccess, singleToastWarn } from '@/utils/singleToast'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { FORMATION_MODES } from '@/context/FORMATION_MODES'

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
  const { courts, formationMode, autoAlternate, autoAlternateMode, setAutoAlternateMode } = useCourts()

  const activePlayers = players.filter((p) => p.active)

  // Ref for scroll container
  const listRef = useRef<HTMLUListElement>(null)

  const [showScrollToFirstIncomplete, setShowScrollToFirstIncomplete] = useState(false)

  const [confirmShuffle, setConfirmShuffle] = useState<{
    open: boolean
    roundIndex: number | null
    roundNumber: number | null
  }>({
    open: false,
    roundIndex: null,
    roundNumber: null,
  })
  const [confirmDelete, setConfirmDelete] = useState<{
    open: boolean
    roundIndex: number | null
    roundNumber: number | null
  }>({
    open: false,
    roundIndex: null,
    roundNumber: null,
  })

  const hasScoresInRound = (idx: number | null) =>
    idx !== null && rounds[idx]?.matches.some((m) => m.gamesA !== null || m.gamesB !== null)

  const hasEnoughForCourts = (plist: Player[], courts: number) =>
    plist.filter((p) => p.active).length >= courts * PLAYERS_PER_MATCH

  // Extracted generation logic
  const generateNewRound = () => {
    if (warnIfInsufficient()) return
    try {
      const currentMode = pickAndAdvanceMode()
      const newRound: UnsavedRound = generateSchedule(activePlayers, courts, currentMode)
      addRound(newRound)
      updatePlayers((prev) => applyRoundStats(prev, newRound, 1))
      singleToastSuccess(`Rodada #${rounds.length + 1} gerada!`, { duration: 3000 })
    } catch (error) {
      singleToastError((error as Error).message, { duration: 6000 })
    }
  }

  // Handle generate click: scroll to top if needed
  const handleGenerate = () => {
    generateNewRound()
    scrollToFirstIncomplete(true)
  }

  const doShuffle = (idx: number) => {
    const oldRound = rounds[idx]
    if (!oldRound) return
    const cleanedPlayers = applyRoundStats(activePlayers, oldRound, -1)
    const currentMode = pickAndAdvanceMode()
    const fresh: UnsavedRound = generateSchedule(cleanedPlayers, courts, currentMode)
    const newRound = { ...fresh, id: oldRound.id, roundNumber: oldRound.roundNumber }
    updatePlayers((prev) => {
      const cleaned = applyRoundStats(prev, oldRound, -1)
      return applyRoundStats(cleaned, newRound, 1)
    })
    replaceRound(idx, newRound)
    singleToastSuccess(`Rodada ${oldRound.roundNumber} embaralhada!`, { duration: 3000 })
  }

  // Faz com que ao ligar o modo automático, o próximo modo seja sempre o inverso do selecionado anterior ao ligar o automático
  const pickAndAdvanceMode = (): FormationMode => {
    const useMode = autoAlternate ? autoAlternateMode : formationMode
    const nextMode = useMode === FORMATION_MODES.MIXED ? FORMATION_MODES.HOMOGENEOUS : FORMATION_MODES.MIXED
    setAutoAlternateMode(nextMode)
    return useMode
  }

  const doDelete = (idx: number) => {
    const roundToRemove = rounds[idx]
    if (!roundToRemove) return
    updatePlayers((prev) => applyRoundStats(prev, roundToRemove, -1))
    removeRound(idx)
    singleToastSuccess(`Rodada #${roundToRemove.roundNumber} excluída!`, { duration: 3000 })
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

  const [currentVisibleRound, setCurrentVisibleRound] = useState<Round | null>(findEarliestIncompleteRound(rounds))
  const [earliestIncompleteRound, setEarliestIncompleteRound] = useState<Round | null>(
    findEarliestIncompleteRound(rounds),
  )
  const roundRefs = useRef<Record<string, HTMLLIElement | null>>({})
  const scrollRef = useRef<HTMLLIElement>(null)

  const [isAutoScrolling, setIsAutoScrolling] = useState<boolean>(true)

  useEffect(() => {
    setEarliestIncompleteRound(findEarliestIncompleteRound(rounds))
  }, [rounds])

  useEffect(() => {
    scrollToFirstIncomplete()
  }, [])

  useLayoutEffect(() => {
    const container = listRef.current
    if (!container) return

    const handleScroll = () => {
      const top = container.getBoundingClientRect().top
      let closest: Round | null = null
      let minOffset = Infinity

      for (const r of rounds) {
        const el = roundRefs.current[r.id]
        if (!el) continue

        const offset = Math.abs(el.getBoundingClientRect().top - top)
        if (offset < minOffset) {
          minOffset = offset
          closest = r
        }
      }

      if (closest && closest.id !== currentVisibleRound?.id) {
        setCurrentVisibleRound(closest)
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => container.removeEventListener('scroll', handleScroll)
  }, [rounds, currentVisibleRound])

  useEffect(() => {
    setShowScrollToFirstIncomplete(earliestIncompleteRound?.id !== currentVisibleRound?.id && !isAutoScrolling)
  }, [earliestIncompleteRound, currentVisibleRound, isAutoScrolling])

  const scrollToFirstIncomplete = (scrollToTop = false) => {
    if (!listRef.current) return

    const container = listRef.current
    let el: HTMLElement | null = null

    if (scrollToTop) {
      el = container.firstElementChild as HTMLElement
    } else {
      if (!earliestIncompleteRound) return

      el = roundRefs.current[earliestIncompleteRound.id] || null
      if (!el) return
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'start' })

    // Scroll end detection
    let lastScrollTop = container.scrollTop
    let isScrolling = false

    const checkScrollEnd = () => {
      if (lastScrollTop === container.scrollTop) {
        if (isScrolling) {
          isScrolling = false
          // Scroll end logic here
        }
      } else {
        lastScrollTop = container.scrollTop
        if (!isScrolling) {
          // isScrolling = true
        }
      }
      setIsAutoScrolling(isScrolling)
      requestAnimationFrame(checkScrollEnd)
    }

    requestAnimationFrame(checkScrollEnd)
  }

  return (
    <React.Fragment>
      {currentVisibleRound &&
        (() => {
          const roundIndex: number = rounds.findIndex((round) => round.id === currentVisibleRound.id)
          const roundNumber: number = currentVisibleRound.roundNumber

          return (
            <div className="flex w-full items-center justify-between">
              <div className="flex flex-col">
                <div className="text-lg font-semibold">
                  Rodada {currentVisibleRound.roundNumber}
                  <span className="text-muted-foreground text-sm font-medium">/{rounds.length}</span>
                </div>
                <p className="text-muted-foreground text-xs font-normal">
                  {formatModeLabel(currentVisibleRound.formationMode)}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="w-7 h-7">
                    <MoreVertical className="!w-4 !h-4" aria-label="Mais opções" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => {
                      if (warnIfInsufficient()) return
                      setConfirmShuffle({ open: true, roundIndex, roundNumber })
                    }}
                  >
                    <Shuffle size={14} aria-hidden="true" /> Embaralhar
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={() => {
                      setConfirmDelete({ open: true, roundIndex, roundNumber })
                    }}
                  >
                    <Trash size={14} aria-hidden="true" /> Apagar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )
        })()}

      <div className="!gap-2 relative flex flex-col justify-between overflow-hidden flex-1 w-full">
        {/* Empty State */}
        <AnimatePresence initial={false}>
          {rounds.length === 0 && (
            <motion.div
              key="no-rounds"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 flex top-0 left-0 pointer-events-none"
            >
              <p className="italic text-muted-foreground">Nenhuma rodada gerada ainda.</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rounds List */}
        <ul
          ref={listRef}
          className={cn('overflow-y-auto gap-12 flex flex-col', 'snap-y snap-mandatory')}
          style={{ scrollBehavior: 'smooth' }}
        >
          <AnimatePresence initial={false}>
            {rounds.map((round, idx) => (
              <motion.li
                key={round.id}
                data-round-idx={idx}
                ref={(el) => {
                  if (el) roundRefs.current[round.id] = el
                  else delete roundRefs.current[round.id]
                  if (round.id === currentVisibleRound?.id) scrollRef.current = el
                }}
                style={{ scrollSnapStop: 'always' }}
                className="flex flex-col gap-2 snap-start min-h-full"
                layout="position"
                variants={itemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <ol className="flex flex-col gap-2">
                  {round.matches.map((m) => {
                    const winner: 'A' | 'B' | null = getWinner(m.gamesA, m.gamesB)

                    return (
                      <li key={m.id} className="rounded-2xl border bg-muted px-3 py-4 shadow-sm flex-1 relative">
                        <div className="flex flex-1 items-center justify-between">
                          <TeamView players={m.teamA} team="A" />
                          <div className="flex items-center gap-1">
                            <ScoreBlock
                              teamKey="A"
                              games={m.gamesA}
                              isWinner={winner === 'A'}
                              matchId={m.id}
                              onChange={(team, val) => setGames(idx, m.id, team, val)}
                            />
                            <X size={14} />
                            <ScoreBlock
                              teamKey="B"
                              games={m.gamesB}
                              isWinner={winner === 'B'}
                              matchId={m.id}
                              onChange={(team, val) => setGames(idx, m.id, team, val)}
                            />
                          </div>
                          <TeamView players={m.teamB} team="B" />
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
        <AnimatePresence initial={false}>
          {showScrollToFirstIncomplete && (
            <motion.div
              key="scroll-top"
              initial={{ opacity: 0, y: 80 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 80 }}
              className="absolute bottom-4 right-4 z-50"
            >
              <Button
                size="sm"
                onClick={() => {
                  scrollToFirstIncomplete(false)
                }}
                aria-label="Ir para primeira rodada incompleta"
                className="shadow-lg text-xs"
              >
                Ir para rodada atual
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className="w-full flex">
        <Button className="flex-1" onClick={handleGenerate} disabled={players.length < PLAYERS_PER_MATCH}>
          Nova rodada
        </Button>
      </div>
      {/* Confirm shuffle dialog */}
      <ConfirmDialog
        open={confirmShuffle.open}
        onOpenChange={(open) => setConfirmShuffle((p) => ({ ...p, open }))}
        title={
          hasScoresInRound(confirmShuffle.roundIndex)
            ? `Descartar resultados e embaralhar rodada ${confirmShuffle.roundNumber}?`
            : `Embaralhar rodada ${confirmShuffle.roundNumber}?`
        }
        description={
          hasScoresInRound(confirmShuffle.roundIndex)
            ? 'Há resultados salvos. Eles serão perdidos permanentemente. Confirme que quer sobrescrever esta rodada.'
            : 'Confirme que os jogos ainda não começaram.'
        }
        onConfirm={() => {
          if (confirmShuffle.roundIndex !== null) {
            doShuffle(confirmShuffle.roundIndex)
            setConfirmShuffle({ open: false, roundIndex: null, roundNumber: null })
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
          hasScoresInRound(confirmDelete.roundIndex)
            ? `Descartar resultados e apagar rodada ${confirmDelete.roundNumber}?`
            : `Apagar rodada ${confirmDelete.roundNumber}?`
        }
        description={
          hasScoresInRound(confirmDelete.roundIndex)
            ? 'Há resultados salvos. Eles serão perdidos permanentemente.'
            : 'Esta ação é irreversível.'
        }
        onConfirm={() => {
          if (confirmDelete.roundIndex !== null) {
            doDelete(confirmDelete.roundIndex)
            setConfirmDelete({ open: false, roundIndex: null, roundNumber: null })
          }
        }}
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        confirmVariant="destructive"
      />
    </React.Fragment>
  )
}

// -----------------------------------------------------------------------------
// TeamView sub-component
// -----------------------------------------------------------------------------
interface TeamViewProps {
  players: Player[]
  team: 'A' | 'B'
}

const TeamView: FC<TeamViewProps> = ({ players, team }) => (
  <div className={cn('flex flex-1 items-center gap-2 justify-end', team === 'A' && 'justify-end flex-row-reverse')}>
    <div className="flex flex-col max-w-full gap-2">
      {players.map((p) => (
        <div key={p.id} className={cn('flex gap-2 text-base items-center', team === 'B' && 'flex-row-reverse')}>
          <Avatar className="w-6 h-6">
            <AvatarImage
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(p.name)}&background=random`}
              alt={p.name}
            />

            <AvatarFallback>
              {p.name.charAt(0).toUpperCase()}
              {p.name.charAt(1).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <p className="text-sm font-medium">{p.name}</p>
        </div>
      ))}
    </div>
  </div>
)

const ScoreSelect: FC<{
  value: number | null
  onChange: (val: number | null) => void
  label: string
}> = ({ value, onChange, label }) => {
  const PLACEHOLDER = '-'

  return (
    <Select
      value={value != null ? String(value) : undefined}
      onValueChange={(val) => onChange(val != null ? Number(val) : null)}
    >
      <SelectTrigger id={label} className="!w-9 !h-9 text-center justify-center text-xs [&>svg]:hidden">
        {/* Renderiza manualmente o valor ou o placeholder */}
        {value != null ? String(value) : PLACEHOLDER}
      </SelectTrigger>

      <SelectContent align="center">
        {SCORE_OPTIONS.map((opt) => (
          <SelectItem key={opt} value={String(opt)}>
            {opt}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

type ScoreBlockProps = {
  teamKey: 'A' | 'B'
  games: number | null
  isWinner: boolean
  matchId: string | number
  onChange: (team: 'A' | 'B', val: number | null) => void
}

const ScoreBlock: React.FC<ScoreBlockProps> = ({ teamKey, games, isWinner, matchId, onChange }) => (
  <div className="flex flex-col items-center relative">
    <Crown
      className={cn('!h-4 !w-4 absolute top-[-50%]', isWinner ? 'text-yellow-500' : 'text-transparent')}
      aria-label="Winner"
    />
    <ScoreSelect value={games} onChange={(val) => onChange(teamKey, val)} label={`games-team-${teamKey}-${matchId}`} />
  </div>
)

function getWinner(gamesA: number | null, gamesB: number | null): 'A' | 'B' | null {
  if (gamesA === null || gamesB === null || gamesA === gamesB) return null
  return gamesA > gamesB ? 'A' : 'B'
}

function formatModeLabel(mode: FormationMode): string {
  return mode === FORMATION_MODES.MIXED ? 'mista' : 'homogênea'
}

function findEarliestIncompleteRound(rounds: Round[]): Round | null {
  const round: Round = rounds
    .filter((round) => round.matches.some((match) => match.gamesA === null || match.gamesB === null))
    .sort((a, b) => a.roundNumber - b.roundNumber)[0]

  return round ? round : null
}

export default MatchesTab
