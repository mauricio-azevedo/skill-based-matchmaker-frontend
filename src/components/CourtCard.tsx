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
  onSaveScore: (gamesA: number, gamesB: number) => void
  canGenerate: boolean
  loading: boolean
}

export const CourtCard = memo(function CourtCard({
  courtId,
  rounds,
  selected,
  onGenerate,
  onSelect,
  onSaveScore,
  canGenerate,
  loading,
}: CourtCardProps) {
  const match: Match | undefined = selected >= 0 ? rounds[selected].matches[0] : undefined

  return (
    <Card aria-label={`Quadra ${courtId}`} className="w-full">
      <CardHeader className="flex flex-col gap-3 p-3">
        <div className="flex w-full items-center justify-between">
          <CardTitle className="text-base">Quadra {courtId}</CardTitle>

          <Button size="sm" className="gap-1" onClick={onGenerate} disabled={!canGenerate || loading}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            Gerar partida
          </Button>
        </div>

        {/* seletor de partidas, se houver mais de uma */}
        {rounds.length > 1 && (
          <Select value={String(selected)} onValueChange={(v) => onSelect(+v)}>
            <SelectTrigger className="w-full h-8">
              <SelectValue placeholder="Escolher partida" />
            </SelectTrigger>
            <SelectContent>
              {rounds.map((_, idx) => (
                <SelectItem key={idx} value={String(idx)} className="text-sm">
                  Partida {idx + 1}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>

      <CardContent className="p-3">
        <MatchCard match={match} onSave={onSaveScore} />
      </CardContent>
    </Card>
  )
})
