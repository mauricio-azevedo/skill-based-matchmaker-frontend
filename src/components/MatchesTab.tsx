import { useMatches } from '@/context/MatchesContext'
import { MatchCard } from '@/components/MatchCard'
import { Fragment, useMemo } from 'react'
import { Separator } from '@/components/ui/separator'
import { translateFormationMode } from '@/lib/formationModes'

export function MatchesTab() {
  const { matches } = useMatches()
  const completedMatches = useMemo(() => matches.filter((m) => m.status === 'completed'), [matches])

  return (
    <div className="flex flex-col w-full h-full">
      <h2 className="text-lg font-semibold leading-tight m-0 text-center">Partidas concluídas</h2>
      <Separator className="mt-2 mb-0" />

      <div className="flex flex-col pl-4 overflow-hidden">
        {completedMatches.length === 0 ? (
          <p className="text-muted-foreground py-4 text-sm text-center !pr-4">
            Nenhuma partida concluída até o momento.
          </p>
        ) : (
          <div className="flex flex-col pb-8 overflow-auto pt-4">
            {completedMatches.map((match, matchIdx) => (
              <Fragment key={match.id}>
                <div className="flex gap-1 items-end-safe">
                  <p className="text-md font-semibold leading-tight">Partida {matchIdx + 1}</p>
                  <p className="text-sm text-muted-foreground leading-tight">
                    {translateFormationMode(match.formationMode)}
                  </p>
                </div>
                <div className="pr-4 mt-4">
                  <MatchCard key={match.id} match={match} />
                </div>
                <Separator className="my-6" />
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
