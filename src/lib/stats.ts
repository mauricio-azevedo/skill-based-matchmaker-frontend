import type { Match } from '@/types/entities'

export interface Stats {
  matchCounts: Record<string, number>
  partnerCounts: Record<string, Record<string, number>>
}

/** Deriva contadores de partidas concluídas. 100 % determinístico. */
export function buildStats(matches: Match[]): Stats {
  const matchCounts: Record<string, number> = {}
  const partnerCounts: Record<string, Record<string, number>> = {}

  for (const m of matches) {
    if (m.status !== 'completed') continue

    const teamA = [m.teamAPlayer1, m.teamAPlayer2]
    const teamB = [m.teamBPlayer1, m.teamBPlayer2]
    const all = [...teamA, ...teamB]

    /* contagem total de partidas por jogador */
    for (const id of all) matchCounts[id] = (matchCounts[id] || 0) + 1

    /* contagem de vezes que jogaram juntos */
    const bump = (x: string, y: string) => {
      partnerCounts[x] ??= {}
      partnerCounts[x][y] = (partnerCounts[x][y] || 0) + 1
    }
    bump(teamA[0], teamA[1])
    bump(teamA[1], teamA[0])
    bump(teamB[0], teamB[1])
    bump(teamB[1], teamB[0])
  }

  return { matchCounts, partnerCounts }
}
