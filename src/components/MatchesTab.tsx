// MatchesTab.tsx — versão shadcn/ui
// Pré-requisitos (run once):
// pnpm dlx shadcn add card input button label badge scroll-area

import { useState, useEffect, type FC } from 'react'
import { toast, Toaster } from 'react-hot-toast'

import { usePlayers } from '@/context/PlayersContext'
import { useRounds } from '@/context/RoundsContext'
import { generateSchedule } from '@/lib/algorithm'
import type { Player } from '@/types/players'

// shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
const PLAYERS_PER_MATCH = 4 as const
const STORAGE_KEY_COURTS = 'match_courts'

// -----------------------------------------------------------------------------
// Custom hook: useLocalStorage
// -----------------------------------------------------------------------------
function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

// -----------------------------------------------------------------------------
// Utility: grid template helper
// -----------------------------------------------------------------------------
const gridTemplate = (courts: number) => ({
  gridTemplateColumns: `repeat(${courts}, minmax(0, 1fr))`,
})

// -----------------------------------------------------------------------------
// Main component
// -----------------------------------------------------------------------------
const MatchesTab: FC = () => {
  const { players, updatePlayers } = usePlayers()
  const { rounds, addRound, setGames, clear } = useRounds()
  const activePlayers = players.filter((p) => p.active)

  const [courts, setCourts] = useLocalStorage<number>(STORAGE_KEY_COURTS, 2)

  /* --------------------------- Handlers --------------------------- */
  const handleGenerate = () => {
    try {
      const newRound = generateSchedule(activePlayers, courts)
      addRound(newRound)

      updatePlayers((prev) => {
        const updated = prev.map((player) => {
          let addedMatches = 0
          const updatedPartners = { ...player.partnerCounts }

          newRound.matches.forEach(({ teamA, teamB }) => {
            const [a1, a2] = teamA
            if (player.id === a1.id || player.id === a2.id) {
              addedMatches++
              const partnerId = player.id === a1.id ? a2.id : a1.id
              updatedPartners[partnerId] = (updatedPartners[partnerId] || 0) + 1
            }
            const [b1, b2] = teamB
            if (player.id === b1.id || player.id === b2.id) {
              addedMatches++
              const partnerId = player.id === b1.id ? b2.id : b1.id
              updatedPartners[partnerId] = (updatedPartners[partnerId] || 0) + 1
            }
          })

          return {
            ...player,
            matchCount: player.matchCount + addedMatches,
            partnerCounts: updatedPartners,
          }
        })

        return updated
      })

      toast.success('Rodada gerada e estatísticas atualizadas!', { duration: 3000 })
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
    toast.success('Rodadas e estatísticas reiniciadas!', { duration: 3000 })
  }

  /* --------------------------- Score input ------------------------- */
  const ScoreInput: FC<{
    value: number | null
    onChange: (v: number | null) => void
  }> = ({ value, onChange }) => (
    <Input
      type="number"
      min={0}
      className="w-16 text-center"
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value
        onChange(v === '' ? null : Number(v))
      }}
    />
  )

  /* ----------------------------- Render ---------------------------- */
  return (
    <section className="container mx-auto flex h-full max-w-3xl flex-col gap-8 px-4 py-8">
      <Card className="flex min-h-0 flex-col">
        <CardHeader>
          <CardTitle>Matches</CardTitle>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-col gap-6 p-6">
          <Toaster position="top-right" />

          {/* ------------------------ Controls ----------------------- */}
          <div className="flex flex-wrap items-end gap-4">
            <div className="grid w-32 gap-2">
              <Label htmlFor="courts">Quadras</Label>
              <Input
                id="courts"
                type="number"
                min={1}
                value={courts}
                onChange={(e) => setCourts(Number(e.target.value))}
              />
            </div>

            <Button onClick={handleGenerate} disabled={players.length < PLAYERS_PER_MATCH}>
              Gerar
            </Button>
            <Button variant="secondary" onClick={handleClear} disabled={rounds.length === 0}>
              Limpar
            </Button>
          </div>

          {/* ---------------------- Rounds list ---------------------- */}
          <ScrollArea className="min-h-0 flex-1 pr-1">
            {rounds.length === 0 ? (
              <p className="italic text-muted-foreground">Nenhuma rodada gerada ainda.</p>
            ) : (
              rounds.map((round, idx) => (
                <article key={idx} className="space-y-4 pt-8 first:pt-0">
                  <h2 className="border-l-4 border-primary pl-3 text-xl font-bold">Rodada {idx + 1}</h2>

                  <ol className="grid gap-6" style={gridTemplate(courts)}>
                    {round.matches.map((m) => (
                      <li key={m.id} className="rounded-2xl border bg-muted p-4 shadow-sm">
                        {/* Times + placar */}
                        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
                          {/* Team A */}
                          <div className={m.winner === 'A' ? 'ring-2 ring-green-500 rounded-lg p-1' : ''}>
                            <TeamView title="Equipe A" team={m.teamA} />
                          </div>

                          {/* Placar */}
                          <div className="flex flex-col items-center gap-1">
                            <ScoreInput value={m.gamesA} onChange={(v) => setGames(idx, m.id, 'A', v)} />
                            <span className="font-bold">×</span>
                            <ScoreInput value={m.gamesB} onChange={(v) => setGames(idx, m.id, 'B', v)} />
                          </div>

                          {/* Team B */}
                          <div className={m.winner === 'B' ? 'ring-2 ring-green-500 rounded-lg p-1' : ''}>
                            <TeamView title="Equipe B" team={m.teamB} />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </article>
              ))
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </section>
  )
}

// -----------------------------------------------------------------------------
// TeamView sub-component
// -----------------------------------------------------------------------------
interface TeamViewProps {
  title: string
  team: Player[]
}
const TeamView: FC<TeamViewProps> = ({ title, team }) => (
  <div className="space-y-1">
    <h3 className="mb-1 text-lg font-medium opacity-75">{title}</h3>
    <ul className="space-y-1">
      {team.map((p) => (
        <li key={p.id} className="flex items-end gap-1 text-base">
          {p.name}
          <Badge variant="secondary" className="ml-1 text-xs">
            Lv {p.level}
          </Badge>
        </li>
      ))}
    </ul>
  </div>
)

export default MatchesTab
