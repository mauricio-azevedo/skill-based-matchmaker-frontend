import { Button } from '@/components/ui/button'
import { MatchCard } from '@/components/MatchCard'
import { useCourts } from '@/context/CourtsContext'
import { useMatches } from '@/context/MatchesContext'
import { usePlayers } from '@/context/PlayersContext'
import { useFormationMode } from '@/context/FormationModeContext'
import { generateMatch } from '@/lib/algorithm'
import { FORMATION_MODES, type FormationMode } from '@/types/types'

export function PlayTab() {
  const { courts } = useCourts()
  const { matches, addMatch } = useMatches()
  const { players } = usePlayers()
  const { formationMode, autoAlternate } = useFormationMode()

  const ongoingMatches = matches.filter((m) => m.status === 'ongoing')

  const handleGenerate = () => {
    const needed = courts - ongoingMatches.length
    if (needed <= 0) return

    // Filtra jogadores ativos e livres
    const active = players.filter((p) => p.active)
    const busyIds = new Set(
      ongoingMatches.flatMap((m) => [m.teamAPlayer1, m.teamAPlayer2, m.teamBPlayer1, m.teamBPlayer2]),
    )
    let available = active.filter((p) => !busyIds.has(p.id))

    // Verifica se há jogadores suficientes para todas as novas partidas
    if (available.length < needed * 4) {
      alert(`Não há jogadores suficientes disponíveis para gerar ${needed} partida(s).`)
      return
    }

    // Define modo inicial (com alternância, se ativada)
    let modeToUse: FormationMode = formationMode
    if (autoAlternate && matches.length > 0) {
      const last = [...matches].reduce((a, b) => (new Date(a.updatedAt) > new Date(b.updatedAt) ? a : b))
      modeToUse =
        last.formationMode === FORMATION_MODES.HOMOGENEOUS ? FORMATION_MODES.MIXED : FORMATION_MODES.HOMOGENEOUS
    }

    // Gera as partidas necessárias
    for (let i = 0; i < needed; i++) {
      const { teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2 } = generateMatch(available, modeToUse)

      // Remove os 4 jogadores usados
      const used = new Set([teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2])
      available = available.filter((p) => !used.has(p.id))

      // Adiciona a partida
      const now = new Date().toISOString()
      addMatch({
        courtId: '', // agora sem uso, mas mantenho string vazia
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

      // Alterna o modo para a próxima iteração
      if (autoAlternate) {
        modeToUse = modeToUse === FORMATION_MODES.HOMOGENEOUS ? FORMATION_MODES.MIXED : FORMATION_MODES.HOMOGENEOUS
      }
    }
  }

  return (
    <div className="space-y-4">
      {ongoingMatches.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma partida em andamento.</p>
      ) : (
        ongoingMatches.map((m) => <MatchCard key={m.id} match={m} />)
      )}

      <Button size="sm" className="w-full" onClick={handleGenerate} disabled={ongoingMatches.length >= courts}>
        Gerar nova partida
      </Button>
    </div>
  )
}
