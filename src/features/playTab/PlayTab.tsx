import type { FC } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { MatchCard } from '@/components/MatchCard'
import { useCourts } from '@/context/CourtsContext'
import { useMatches } from '@/context/MatchesContext'
import { usePlayers } from '@/context/PlayersContext'
import { useFormationMode } from '@/context/FormationModeContext'
import { generateMatch } from '@/lib/algorithm'
import { FORMATION_MODES, type FormationMode } from '@/types/types'

export const PlayTab: FC = () => {
  const { courtsEntities, updateCourt } = useCourts()
  const { matches, getById, addMatch } = useMatches()
  const { players } = usePlayers()
  const { formationMode, autoAlternate } = useFormationMode()

  // Partidas em andamento
  const ongoingMatches = matches.filter((m) => m.status === 'ongoing')
  const ongoingCount = ongoingMatches.length

  const handleGenerateAll = () => {
    // quais quadras estão livres (sem match ou com match já concluída)
    const freeCourts = courtsEntities.filter((court) => {
      const m = court.matchId ? getById(court.matchId) : null
      return !m || m.status === 'completed'
    })
    const needed = freeCourts.length
    if (needed === 0) return

    // jogadores ativos não ocupados em ongoing
    const active = players.filter((p) => p.active)
    const busyIds = new Set(
      ongoingMatches.flatMap((m) => [m.teamAPlayer1, m.teamAPlayer2, m.teamBPlayer1, m.teamBPlayer2]),
    )
    let available = active.filter((p) => !busyIds.has(p.id))

    if (available.length < needed * 4) {
      alert(`Não há jogadores suficientes disponíveis para gerar ${needed} partida(s).`)
      return
    }

    // define modo inicial e alterna se necessário
    let modeToUse: FormationMode = formationMode
    if (autoAlternate && matches.length > 0) {
      const last = [...matches].reduce((a, b) => (new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b))
      modeToUse =
        last.formationMode === FORMATION_MODES.HOMOGENEOUS ? FORMATION_MODES.MIXED : FORMATION_MODES.HOMOGENEOUS
    }

    // gera uma partida para cada quadra livre
    freeCourts.forEach((court) => {
      const { teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2 } = generateMatch(available, modeToUse)

      // remove os 4 jogadores usados
      const used = new Set([teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2])
      available = available.filter((p) => !used.has(p.id))

      const now = new Date().toISOString()
      const newMatchId = addMatch({
        courtId: court.id,
        teamAPlayer1,
        teamAPlayer2,
        teamBPlayer1,
        teamBPlayer2,
        startTime: now,
        endTime: null,
        status: 'ongoing',
        gamesA: null,
        gamesB: null,
        winner: null,
        formationMode: modeToUse,
      })

      updateCourt(court.id, newMatchId)

      if (autoAlternate) {
        modeToUse = modeToUse === FORMATION_MODES.HOMOGENEOUS ? FORMATION_MODES.MIXED : FORMATION_MODES.HOMOGENEOUS
      }
    })
  }

  return (
    <div className="space-y-4">
      {courtsEntities.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma quadra cadastrada.</p>}

      {courtsEntities.map((court, idx) => {
        const match = court.matchId ? (getById(court.matchId) ?? null) : null
        return (
          <Card key={court.id} className="!h-[unset] !gap-8">
            <CardHeader className="flex justify-between items-center">
              <CardTitle>Quadra {idx + 1}</CardTitle>
              {match && (
                <span className="px-2 py-0.5 text-xs font-medium rounded bg-gray-100 text-gray-800 uppercase">
                  {match.formationMode}
                </span>
              )}
            </CardHeader>
            <CardContent>
              <MatchCard key={match?.id ?? court.id} match={match} />
            </CardContent>
          </Card>
        )
      })}

      <Button size="sm" className="w-full" onClick={handleGenerateAll} disabled={ongoingCount >= courtsEntities.length}>
        Gerar novas partidas
      </Button>
    </div>
  )
}
