import React, { type FC, useEffect, useRef, useState } from 'react'

import { usePlayers } from '@/context/PlayersContext'
import { useRounds } from '@/context/RoundsContext'
import { generateSchedule } from '@/lib/algorithm'
import type { Player, UnsavedRound } from '@/types/players'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Crown, MoreVertical, Shuffle, Trash, X } from 'lucide-react'
import { useCourts } from '@/context/CourtsContext'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AnimatePresence, motion } from 'framer-motion'
import { itemVariants } from '@/consts/animation'
import { singleToastError, singleToastSuccess, singleToastWarn } from '@/utils/singleToast'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
    <React.Fragment>
      <div className="flex w-full items-center justify-between h-8">
        <div className="text-lg font-semibold">Rodadas</div>
      </div>
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
          className={cn(
            'overflow-y-auto gap-12 flex flex-col',
            disableSnap ? 'snap-none' : 'snap-y snap-mandatory',
            'shadow-inner',
          )}
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
                className="flex flex-col gap-2 snap-start"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-2xl font-semibold tracking-tight">Rodada {round.roundNumber}</div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8">
                        <MoreVertical className="!w-5 !h-5" aria-label="Mais opções" />
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
                <ol className="flex flex-col gap-2 flex-1">
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
  const display = value !== null ? String(value) : PLACEHOLDER

  return (
    <Select value={display} onValueChange={(val) => onChange(val === PLACEHOLDER ? null : Number(val))}>
      <SelectTrigger id={label} className="!w-8 !h-8 text-center justify-center text-xs [&>svg]:hidden">
        <SelectValue>{display}</SelectValue>
      </SelectTrigger>

      <SelectContent align="center">
        <SelectItem value={PLACEHOLDER}>-</SelectItem>
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

export default MatchesTab
