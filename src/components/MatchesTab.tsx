import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { readAllCourtMatches } from '@/storage/courtMatchesStorage'
import type { Match, UnsavedRound } from '@/types/players'

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const formatTeam = (team: Match['teamA']) => `${team[0].name} & ${team[1].name}`

const loadFinishedMatches = (): Match[] => {
  const rounds: UnsavedRound[] = Object.values(readAllCourtMatches()).flat()

  return rounds
    .flatMap((r) => r.matches)
    .filter((m) => m.gamesA !== null && m.gamesB !== null) // só finalizadas
    .sort((a, b) => {
      const updatedAtA = Number(a.updatedAt)
      const updatedAtB = Number(b.updatedAt)
      return (updatedAtB || 0) - (updatedAtA || 0) // se for NaN, usa 0
    })
}

/* ------------------------------------------------------------------ */
/* Component                                                          */
/* ------------------------------------------------------------------ */
export function MatchesTab() {
  const [matches, setMatches] = useState<Match[]>(loadFinishedMatches)

  /* Atualiza caso outra aba altere o storage */
  useEffect(() => {
    const refresh = () => setMatches(loadFinishedMatches())
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [])

  return (
    <div className="flex flex-col w-full overflow-hidden">
      <h2 className="text-lg font-semibold mb-2">Jogos</h2>

      {matches.length === 0 ? (
        <p className="italic text-muted-foreground p-4 text-sm">Nenhuma partida concluída até o momento.</p>
      ) : (
        <Table>
          <TableHeader className="sticky top-0 bg-background z-10 shadow-md">
            {/* sticky header */}
            <TableRow>
              <TableHead className="w-3/4">Duplas</TableHead>
              <TableHead className="text-right w-1/4">Placar</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {matches.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="truncate">
                  {formatTeam(m.teamA)} vs. {formatTeam(m.teamB)}
                </TableCell>
                <TableCell className="text-right">
                  {m.gamesA}&nbsp;:&nbsp;{m.gamesB}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
