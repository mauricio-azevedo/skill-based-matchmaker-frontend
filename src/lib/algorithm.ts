import type { Player } from '../context/PlayersContext.tsx'

export interface Team extends Array<Player> {}
export interface Match {
  teamA: Team
  teamB: Team
}

export interface MatchesResult {
  matches: Match[]
  counts: Record<string, number>
}

/**
 * Generate matches so every player participates at least once.
 * If there are not enough unique players for the final match, players
 * with the fewest previous matches are reused at random.
 */
export function generateMatches(players: Player[], teamSize = 2): MatchesResult {
  if (players.length < teamSize * 2) return { matches: [], counts: {} }

  const counts: Record<string, number> = {}
  players.forEach((p) => {
    counts[p.id] = 0
  })

  const shuffled = [...players]
  shuffle(shuffled)
  const queue = [...shuffled]
  const matches: Match[] = []
  const numMatches = Math.ceil(players.length / (teamSize * 2))

  for (let m = 0; m < numMatches; m++) {
    const picked: Player[] = []
    for (let i = 0; i < teamSize * 2; i++) {
      let player: Player | undefined = queue.shift()
      if (!player) {
        player = pickWithFewestMatches(players, counts, new Set(picked.map((p) => p.id)))
      } else if (picked.some((p) => p.id === player!.id)) {
        // avoid duplicates if queue provides already used player
        queue.unshift(player)
        player = pickWithFewestMatches(players, counts, new Set(picked.map((p) => p.id)))
      }
      counts[player.id]++
      picked.push(player)
    }
    matches.push({ teamA: picked.slice(0, teamSize), teamB: picked.slice(teamSize) })
  }

  return { matches, counts }
}

function pickWithFewestMatches(players: Player[], counts: Record<string, number>, used: Set<string>): Player {
  let min = Math.min(...players.map((p) => counts[p.id]))
  while (true) {
    const candidates = players.filter((p) => counts[p.id] === min && !used.has(p.id))
    if (candidates.length > 0) {
      return candidates[Math.floor(Math.random() * candidates.length)]
    }
    min++
  }
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
}
