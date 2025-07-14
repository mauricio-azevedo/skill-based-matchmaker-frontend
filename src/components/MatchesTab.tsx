import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useMatches } from '@/context/MatchesContext'
import { usePlayers } from '@/context/PlayersContext'
import { useMemo, useState } from 'react'
import { Edit } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MatchCard } from '@/components/MatchCard'
import type { Match, Player } from '@/types/types'

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const formatTeam = (
  player1Id: string | null,
  player2Id: string | null,
  getPlayer: (id: string) => Player | null,
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

export function MatchesTab() {
  const { matches, getById: getMatchById } = useMatches()
  const { getById: getPlayer } = usePlayers()
  const completedMatches: Match[] = useMemo(() => matches.filter((m) => m.status === 'completed'), [matches])

  const [open, setOpen] = useState(false)
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null)

  const openDialog = (matchId: string) => {
    setSelectedMatchId(matchId)
    setOpen(true)
  }

  const closeDialog = () => {
    setOpen(false)
    setSelectedMatchId(null)
  }

  const selectedMatch = selectedMatchId ? getMatchById(selectedMatchId) : null

  return (
    <div className="flex flex-col w-full overflow-hidden">
      <h2 className="text-lg font-semibold mb-2">Jogos Finalizados</h2>

      {completedMatches.length === 0 ? (
        <p className="italic text-muted-foreground p-4 text-sm">Nenhuma partida concluída até o momento.</p>
      ) : (
        <>
          <Table>
            <TableHeader className="sticky top-0 bg-background z-10 shadow-md">
              <TableRow>
                <TableHead className="w-3/4">Duplas</TableHead>
                <TableHead className="text-right w-1/6">Placar</TableHead>
                <TableHead className="text-center w-1/12">Editar</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {completedMatches.map((m) => {
                const teamA = formatTeam(m.teamAPlayer1, m.teamAPlayer2, getPlayer)
                const teamB = formatTeam(m.teamBPlayer1, m.teamBPlayer2, getPlayer)
                const score = `${m.gamesA} : ${m.gamesB}`

                return (
                  <TableRow key={m.id}>
                    <TableCell className="truncate">
                      {teamA} vs. {teamB}
                    </TableCell>
                    <TableCell className="text-right">{score}</TableCell>
                    <TableCell className="text-center">
                      <Button variant="ghost" size="icon" onClick={() => openDialog(m.id)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <Dialog open={open} onOpenChange={(open) => !open && closeDialog()}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Placar</DialogTitle>
              </DialogHeader>

              {/* Reuso do MatchCard para edição de placar */}
              {selectedMatch ? (
                <MatchCard key={selectedMatch.id} match={selectedMatch} />
              ) : (
                <p className="text-sm text-muted-foreground">Selecione uma partida para editar.</p>
              )}

              <DialogFooter>
                <Button variant="secondary" onClick={closeDialog}>
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
