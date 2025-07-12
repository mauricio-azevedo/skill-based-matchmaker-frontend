import { useEffect, useState } from 'react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { readAllCourtMatches } from '@/storage/courtMatchesStorage'
import type { Match } from '@/types/players'

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */
const formatTeam = (team: Match['teamA']) => {
  if (team && team.length >= 2) {
    return `${team[0].name} & ${team[1].name}`
  }
  return 'Equipe incompleta'
}

/* Helpers */
const loadFinishedMatches = (): Match[] => {
  const courts = readAllCourtMatches()

  // Filtra os matches para incluir apenas os finalizados
  return Object.values(courts)
    .map((court) => court.match) // Acessando o match diretamente
    .filter((match) => match && match.gamesA !== null && match.gamesB !== null) // Verificando se o placar está finalizado
    .sort((a, b) => {
      const updatedAtA = Number(a.updatedAt)
      const updatedAtB = Number(b.updatedAt)
      return (updatedAtB || 0) - (updatedAtA || 0) // Se for NaN, usa 0
    })
}

/* Component */
export function MatchesTab() {
  const [matches, setMatches] = useState<Match[]>(loadFinishedMatches)

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
                  {/* Verificação adicional para garantir que o time seja válido */}
                  {m.teamA && m.teamB ? (
                    <>
                      {formatTeam(m.teamA)} vs. {formatTeam(m.teamB)}
                    </>
                  ) : (
                    <span className="italic text-muted-foreground">Equipe incompleta</span>
                  )}
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
