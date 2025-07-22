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
      <div className="w-full border-b border-border min-h-11 max-h-11 flex items-center justify-center relative">
        <h2 className="text-xl font-semibold leading-tight m-0">Partidas concluídas</h2>
      </div>

      {completedMatches.length === 0 ? (
        <div className="pl-4 h-full flex items-center justify-center pr-4">
          <p className="text-md text-muted-foreground">Nenhuma partida concluída ainda.</p>
        </div>
      ) : (
        <div className="pl-4 flex flex-col pb-8 overflow-y-auto overscroll-y-contain pt-4">
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
  )
}
