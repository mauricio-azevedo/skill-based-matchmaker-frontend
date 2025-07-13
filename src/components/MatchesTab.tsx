import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import type { Match, Player } from '@/types/types'
import { useMatches } from '@/context/MatchesContext'
import { usePlayers } from '@/context/PlayersContext'

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const formatTeam = (
  player1Id: string | null,
  player2Id: string | null,
  getPlayer: (id: string) => Player | undefined,
): string => {
  if (player1Id && player2Id) {
    const p1 = getPlayer(player1Id)
    const p2 = getPlayer(player2Id)
    if (p1 && p2) {
      return `${p1.name} & ${p2.name}`
    }
  }
  return 'Equipe incompleta'
}

/* Component */
export function MatchesTab() {
  const { matches } = useMatches()
  const { getById: getPlayer } = usePlayers()
  const completedMatches: Match[] = matches.filter((m) => m.status === 'completed')

  return (
    <div className="flex flex-col w-full overflow-hidden">
      <h2 className="text-lg font-semibold mb-2">Jogos Finalizados</h2>

      {completedMatches.length === 0 ? (
        <p className="italic text-muted-foreground p-4 text-sm">Nenhuma partida concluída até o momento.</p>
      ) : (
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10 shadow-md">
            <TableRow>
              <TableHead className="w-3/4">Duplas</TableHead>
              <TableHead className="text-right w-1/4">Placar</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {completedMatches.map((m) => {
              const teamA = formatTeam(m.teamAPlayer1, m.teamAPlayer2, getPlayer)
              const teamB = formatTeam(m.teamBPlayer1, m.teamBPlayer2, getPlayer)
              // Como status === 'completed', gamesA e gamesB devem estar definidos
              const score = `${m.gamesA} : ${m.gamesB}`

              return (
                <TableRow key={m.id}>
                  <TableCell className="truncate">
                    {teamA} vs. {teamB}
                  </TableCell>
                  <TableCell className="text-right">{score}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
