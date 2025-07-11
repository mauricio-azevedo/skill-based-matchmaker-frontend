import { memo } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
  onSaveScore,
  canGenerate,
  loading,
}: CourtCardProps) {
  const match: Match | undefined = selected >= 0 ? rounds[selected].matches[0] : undefined

  return (
    <Card aria-label={`Quadra ${courtId}`} className="!min-h-[unset]">
      <CardHeader className="flex flex-col gap-3 p-3">
        <div className="flex w-full items-center justify-between">
          <CardTitle className="text-base">Quadra {courtId}</CardTitle>

          <Button size="sm" className="gap-1" onClick={onGenerate} disabled={!canGenerate || loading}>
            {loading && <Loader2 size={14} className="animate-spin" />}
            Gerar partida
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-3 !min-h-[unset]">
        <MatchCard match={match} onSave={onSaveScore} />
      </CardContent>
    </Card>
  )
})
