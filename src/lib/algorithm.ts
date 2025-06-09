import type { Player } from '../context/PlayersContext.tsx'

export type Team = Player[]
export interface Match {
  teamA: Team
  teamB: Team
}

/**
 * Generate skill‑balanced matches with generic teamSize T.
 * – groups players by skill level
 * – forms disjoint teams of size T inside each level bucket
 * – pairs identical skill‑multisets together into matches
 */
export function generateMatches(players: Player[], teamSize = 2): Match[] {
  if (players.length < teamSize * 2) return []

  // 1. group by level
  const byLevel: Record<number, Player[]> = {}
  players.forEach((p) => {
    ;(byLevel[p.level] ??= []).push(p)
  })

  // ensure each bucket length is multiple of teamSize
  for (const lvl in byLevel) {
    const bucket = byLevel[lvl]
    if (bucket.length % teamSize !== 0) {
      // drop extras (could add dummy)
      byLevel[lvl] = bucket.slice(0, bucket.length - (bucket.length % teamSize))
    }
  }

  // 2. inside each level, slice into teams of size T (simple round‑robin slice)
  const teams: Team[] = []
  for (const bucket of Object.values(byLevel)) {
    for (let i = 0; i < bucket.length; i += teamSize) {
      teams.push(bucket.slice(i, i + teamSize))
    }
  }

  // 3. pair teams that share the same multiset of levels (here, identical)
  const matches: Match[] = []
  const used = new Set<number>()
  for (let i = 0; i < teams.length; i++) {
    if (used.has(i)) continue
    for (let j = i + 1; j < teams.length; j++) {
      if (used.has(j)) continue
      if (sameLevels(teams[i], teams[j])) {
        matches.push({ teamA: teams[i], teamB: teams[j] })
        used.add(i)
        used.add(j)
        break
      }
    }
  }
  return matches
}

function sameLevels(a: Team, b: Team) {
  return a.length === b.length && a.every((p) => b.some((q) => q.level === p.level))
}
