import { useMatches } from '@/context/MatchesContext'
import { MatchCard } from '@/components/MatchCard'
import { useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card'

export function MatchesTab() {
  const { matches } = useMatches()
  const completedMatches = useMemo(() => matches.filter((m) => m.status === 'completed'), [matches])

  return (
    <div className="flex flex-col w-full overflow-auto space-y-2">
      <h2 className="text-lg font-semibold">Jogos Finalizados</h2>

      {completedMatches.length === 0 ? (
        <p className="italic text-muted-foreground p-4 text-sm">Nenhuma partida concluída até o momento.</p>
      ) : (
        completedMatches.map((match) => (
          <div key={match.id}>
            <Card>
              <CardContent>
                <MatchCard key={match.id} match={match} />
              </CardContent>
            </Card>
          </div>
        ))
      )}
    </div>
  )
}
