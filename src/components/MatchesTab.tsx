import { type FC, useEffect, useRef, useState } from 'react'

import { usePlayers } from '@/context/PlayersContext'
import { useRounds } from '@/context/RoundsContext'
import { generateSchedule } from '@/lib/algorithm'
import type { Player } from '@/types/players'

// shadcn/ui
import { toast } from 'sonner'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const PLAYERS_PER_MATCH = 4 as const
const STORAGE_KEY_COURTS = 'match_courts'

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
// Custom hook: useLocalStorage
// -----------------------------------------------------------------------------
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem(key) : null
    return stored ? (JSON.parse(stored) as T) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

// -----------------------------------------------------------------------------
// ScoreModal sub-component (handles its own local state for robustness)
// -----------------------------------------------------------------------------
interface ScoreModalProps {
  open: boolean
  onClose: () => void
  initialScoreA: number | null
  initialScoreB: number | null
  onSave: (scoreA: number, scoreB: number) => void
}

const ScoreModal: FC<ScoreModalProps> = ({ open, onClose, initialScoreA, initialScoreB, onSave }) => {
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
      value={value !== null ? String(value) : undefined}
      onValueChange={(val: string) => {
        if (val === '') return
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
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inserir placar</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div>
            <p className="font-medium mb-1">Time A</p>
            {renderScoreToggle(scoreA, setScoreA)}
          </div>
          <div>
            <p className="font-medium mb-1">Time B</p>
            {renderScoreToggle(scoreB, setScoreB)}
          </div>
        </div>
        <DialogFooter className="pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSave}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------
const MatchesTab: FC = () => {
  const { players, updatePlayers } = usePlayers()
  const { rounds, addRound, setGames, clear } = useRounds()

  const activePlayers = players.filter((p) => p.active)

  const hasAutoGenerated = useRef(false)

  const [courts, setCourts] = useLocalStorage<number>(STORAGE_KEY_COURTS, 2)
  const [selectedRoundIndex, setSelectedRoundIndex] = useState<number>(rounds.length > 0 ? rounds.length - 1 : 0)

  // Modal state consolidated for robustness
  const [modalState, setModalState] = useState<{
    open: boolean
    matchId: string | null
    initialA: number | null
    initialB: number | null
  }>({ open: false, matchId: null, initialA: null, initialB: null })

  // ---------------------------------------------------------------------------
  // Effects
  // ---------------------------------------------------------------------------
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
    // ao adicionar/limpar, selecione sempre a última existente
    if (rounds.length === 0) {
      setSelectedRoundIndex(0)
    } else if (selectedRoundIndex > rounds.length - 1) {
      setSelectedRoundIndex(rounds.length - 1)
    }
  }, [rounds, selectedRoundIndex])

  // ---------------------------------------------------------------------------
  // Handlers – Generation / Shuffle / Clear
  // ---------------------------------------------------------------------------
  const handleGenerate = () => {
    try {
      const newRound = generateSchedule(activePlayers, courts)
      const newIndex = rounds.length
      addRound(newRound)
      setSelectedRoundIndex(newIndex)
      updatePlayers((prev) => applyRoundStats(prev, newRound, 1))
      toast.success(`Rodada #${newIndex + 1} gerada!`, {
        duration: 3000,
      })
    } catch (error) {
      toast.error((error as Error).message, {
        duration: 6000,
      })
    }
  }

  const handleShuffle = () => {
    if (players.length < PLAYERS_PER_MATCH) return

    if (rounds.length === 0) {
      handleGenerate()
      return
    }

    const prevRounds = [...rounds]
    const remainingRounds = prevRounds.slice(0, -1)

    clear()
    updatePlayers((prev) => prev.map((p) => ({ ...p, matchCount: 0, partnerCounts: {} })))

    remainingRounds.forEach((r) => {
      addRound(r)
      updatePlayers((prev) => applyRoundStats(prev, r, 1))
    })

    try {
      const newRound = generateSchedule(activePlayers, courts)
      addRound(newRound)
      updatePlayers((prev) => applyRoundStats(prev, newRound, 1))
      setSelectedRoundIndex(remainingRounds.length)
      toast.success('Rodada embaralhada com sucesso!', { duration: 3000 })
    } catch (error) {
      toast.error((error as Error).message, { duration: 6000 })
    }
  }

  const handleClear = () => {
    clear()
    updatePlayers((prev) =>
      prev.map((player) => ({
        ...player,
        matchCount: 0,
        partnerCounts: {},
      })),
    )
    toast.success('Todas as rodadas apagadas!', { duration: 3000 })
  }

  // ---------------------------------------------------------------------------
  // Handlers – Scores
  // ---------------------------------------------------------------------------
  const openScoreModalFor = (matchId: string) => {
    const round = rounds[selectedRoundIndex]
    const match = round.matches.find((m) => m.id === matchId)

    setModalState({
      open: true,
      matchId,
      initialA: match?.gamesA ?? null,
      initialB: match?.gamesB ?? null,
    })
  }

  const handleSaveScore = (scoreA: number, scoreB: number) => {
    if (!modalState.matchId) return
    setGames(selectedRoundIndex, modalState.matchId, 'A', scoreA)
    setGames(selectedRoundIndex, modalState.matchId, 'B', scoreB)
    setModalState((prev) => ({ ...prev, open: false }))
    toast.success('Placar salvo!', { duration: 2500 })
  }

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------
  return (
    <>
      {/* Modal primeiro para ficar fora do fluxo do Card */}
      <ScoreModal
        open={modalState.open}
        onClose={() => setModalState((prev) => ({ ...prev, open: false }))}
        initialScoreA={modalState.initialA}
        initialScoreB={modalState.initialB}
        onSave={handleSaveScore}
      />

      <Card>
        {/* ----------------------------- Header ----------------------------- */}
        <CardHeader>
          <CardTitle>Partidas</CardTitle>
        </CardHeader>

        <CardContent>
          {/* ------------------------ Controls ----------------------- */}
          <div className="flex flex-wrap items-end gap-4 justify-between">
            <div className="flex flex-col gap-3">
              <Label htmlFor="courts">Quadras</Label>
              <Input
                className="w-16"
                id="courts"
                type="number"
                min={1}
                value={courts}
                onChange={(e) => setCourts(Number(e.target.value))}
              />
            </div>

            {rounds.length > 0 && (
              <div className="flex gap-2">
                <Button variant="destructive" onClick={handleClear} disabled={rounds.length === 0}>
                  Limpar
                </Button>

                <Select value={String(selectedRoundIndex)} onValueChange={(v) => setSelectedRoundIndex(Number(v))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    {rounds.map((_, idx) => (
                      <SelectItem key={idx} value={String(idx)}>
                        Rodada {idx + 1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* ---------------------- Rounds list ---------------------- */}
          <ScrollArea className="min-h-0 relative flex-1 overflow-hidden" type="scroll">
            <ul className="h-full w-full flex flex-col gap-2">
              {rounds.length === 0 ? (
                <p className="italic text-muted-foreground">Nenhuma rodada gerada ainda.</p>
              ) : (
                (() => {
                  const round = rounds[selectedRoundIndex]
                  return (
                    <article className="flex flex-col flex-1 gap-2">
                      <h2 className="border-l-4 border-primary pl-3 text-xl font-bold">
                        Rodada {selectedRoundIndex + 1}
                      </h2>
                      <ol className="flex flex-col gap-6 overflow-hidden flex-1">
                        {round.matches.map((m) => {
                          const hasScore = m.gamesA !== null && m.gamesB !== null
                          return (
                            <li
                              key={m.id}
                              className="rounded-2xl border bg-muted px-3 py-4 shadow-sm overflow-hidden flex-1"
                            >
                              {/* Times + placar */}
                              <div className="flex flex-1 items-center gap-4">
                                <TeamView players={m.teamA} isWinner={m.winner === 'A'} team={'A'} />
                                <div
                                  className="flex flex-col items-center gap-1"
                                  onClick={() => openScoreModalFor(m.id)}
                                >
                                  {!hasScore && (
                                    <Button size="sm" variant="ghost">
                                      Inserir placar
                                    </Button>
                                  )}
                                  {hasScore && (
                                    <span className="text-sm font-medium">
                                      {m.gamesA} × {m.gamesB}
                                    </span>
                                  )}
                                </div>
                                <TeamView players={m.teamB} isWinner={m.winner === 'B'} team={'B'} />
                              </div>
                            </li>
                          )
                        })}
                      </ol>
                    </article>
                  )
                })()
              )}
            </ul>
          </ScrollArea>
        </CardContent>
        <CardFooter>
          <div className="flex w-full gap-2">
            <Button
              className="flex-1 max-w-fit"
              variant="ghost"
              onClick={handleShuffle}
              disabled={rounds.length === 0 || players.length < PLAYERS_PER_MATCH}
            >
              Embaralhar
            </Button>
            <Button className="flex-1" onClick={handleGenerate} disabled={players.length < PLAYERS_PER_MATCH}>
              Gerar
            </Button>
          </div>
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
  <div className={cn('flex flex-1 flex-col gap-2', isWinner && 'ring-2 ring-green-500 rounded-lg p-1')}>
    <div className="flex flex-col max-w-full">
      {players.map((p) => (
        <div key={p.id} className={cn('flex items-end gap-2 text-base', team === 'B' && 'justify-end')}>
          <p>{p.name}</p>
        </div>
      ))}
    </div>
  </div>
)

export default MatchesTab
