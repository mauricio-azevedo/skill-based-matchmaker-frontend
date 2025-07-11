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
    <Card aria-label={`Quadra ${courtId}`} className="!min-h-[unset] !gap-0 !py-2">
      <CardHeader className="flex flex-col gap-3 p-3">
        <CardTitle className="text-base">Quadra {courtId}</CardTitle>
      </CardHeader>

      <CardContent className="p-3 !min-h-[unset] flex flex-col gap-3">
        {/* key força remontagem quando muda a partida */}
        <MatchCard key={match?.id ?? 'no-match'} match={match} onSave={onSaveScore} />

        <Button size="sm" className="gap-1 self-center" onClick={onGenerate} disabled={!canGenerate || loading}>
          {loading && <Loader2 size={14} className="animate-spin" />}
          Gerar partida
        </Button>
      </CardContent>
    </Card>
  )
})
