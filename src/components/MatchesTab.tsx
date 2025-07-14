import { useMatches } from '@/context/MatchesContext'
import { MatchCard } from '@/components/MatchCard'
import { Fragment, useMemo } from 'react'
import { Separator } from '@/components/ui/separator'

export function MatchesTab() {
  const { matches } = useMatches()
  const completedMatches = useMemo(() => matches.filter((m) => m.status === 'completed'), [matches])

  return (
    <div className="flex flex-col w-full overflow-hidden space-y-2">
      <h2 className="text-lg font-semibold mb-4">Histórico de partidas</h2>

      {completedMatches.length === 0 ? (
        <p className="italic text-muted-foreground p-4 text-sm">Nenhuma partida concluída até o momento.</p>
      ) : (
        <div className="flex flex-col pb-8 overflow-auto">
          {completedMatches.map((match, index) => (
            <Fragment key={match.id}>
              <div className="px-2">
                <MatchCard match={match} />
              </div>
              {index < completedMatches.length - 1 && <Separator className="my-4" />}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  )
}
