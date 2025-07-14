import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useMatches } from '@/context/MatchesContext'
import { usePlayers } from '@/context/PlayersContext'
import { useState } from 'react'
import { Edit } from 'lucide-react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Match, Player } from '@/types/types'

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

export function MatchesTab() {
  const { matches, updateMatch } = useMatches()
  const { getById: getPlayer } = usePlayers()
  const completedMatches: Match[] = matches.filter((m) => m.status === 'completed')

  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Match | null>(null)
  const [scoreA, setScoreA] = useState(0)
  const [scoreB, setScoreB] = useState(0)

  const openDialog = (match: Match) => {
    setSelected(match)
    setScoreA(match.gamesA ?? 0)
    setScoreB(match.gamesB ?? 0)
    setOpen(true)
  }

  const handleSave = () => {
    if (selected) {
      updateMatch(selected.id, {
        gamesA: scoreA,
        gamesB: scoreB,
        winner: scoreA > scoreB ? 'A' : scoreB > scoreA ? 'B' : null,
      })
    }
    setOpen(false)
  }

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
                      <Button variant="ghost" size="icon" onClick={() => openDialog(m)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Placar</DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                <div>
                  <Label>Placar Equipe A</Label>
                  <Input type="number" value={scoreA} onChange={(e) => setScoreA(Number(e.target.value))} />
                </div>
                <div>
                  <Label>Placar Equipe B</Label>
                  <Input type="number" value={scoreB} onChange={(e) => setScoreB(Number(e.target.value))} />
                </div>
              </div>

              <DialogFooter>
                <Button variant="secondary" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>Salvar</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )
}
