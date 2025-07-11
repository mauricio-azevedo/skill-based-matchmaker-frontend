import { memo } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MatchCard } from '@/components/MatchCard'
import type { Match, UnsavedRound } from '@/types/players'

export interface CourtCardProps {
  courtId: number
  rounds: UnsavedRound[]
  selected: number
  onGenerate: () => void
  onSelect: (index: number) => void
  canGenerate: boolean
  loading: boolean
  onSaveScore: (gamesA: number, gamesB: number) => void
}

export const CourtCard = memo(function CourtCard({
  courtId,
  rounds,
  selected,
  onGenerate,
  onSelect,
  canGenerate,
  loading,
  onSaveScore,
}: CourtCardProps) {
  const match: Match | undefined = selected >= 0 ? rounds[selected].matches[0] : undefined

  return (
    <Card aria-label={`Quadra ${courtId}`}>
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle>Quadra {courtId}</CardTitle>
        <Button size="sm" onClick={onGenerate} disabled={!canGenerate || loading} className="gap-1">
          {loading && <Loader2 size={14} className="animate-spin" />}
          Gerar nova partida
        </Button>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {rounds.length > 1 && (
          <Select value={String(selected)} onValueChange={(v) => onSelect(+v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Escolher partida" />
            </SelectTrigger>
            <SelectContent>
              {rounds.map((_, idx) => (
                <SelectItem key={idx} value={String(idx)}>
                  Partida {idx + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <MatchCard match={match} onSave={onSaveScore} />
      </CardContent>
    </Card>
  )
})
