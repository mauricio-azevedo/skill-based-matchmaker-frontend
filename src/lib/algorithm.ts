// src/lib/algorithm.ts

import type { Player, Round } from '../types/players'

// minimum number of players required for one match
const MIN_PLAYERS = 4 as const

/**
 * Shuffle an array in-place using Fisher-Yates algorithm.
 */
function shuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

/**
 * Generates a single round balanced across:
 *  - individual skill differences (α)
 *  - total team skill differences (α)
 *  - games played imbalance (β)
 *  - partnership frequency imbalance (γ)
 *
 * @param players Array of all players
 * @param courts Number of courts (matches) to schedule
 * @param matchCounts Map of playerId -> total matches played
 * @param partnerCounts Map of playerId -> (otherId -> times paired)
 */
export function generateSchedule(
  players: Player[],
  courts: number,
  matchCounts: Map<string, number>,
  partnerCounts: Map<string, Map<string, number>>,
): Round {
  if (players.length < MIN_PLAYERS) {
    throw new Error(`É preciso ao menos ${MIN_PLAYERS} jogadores para gerar o cronograma.`)
  }

  // weight constants
  const alpha = 2 // skill imbalance weight
  const beta = 1 // match count imbalance weight
  const gamma = 1 // partnership frequency imbalance weight

  // 1) build all unique player pairs
  const pairs: [Player, Player][] = []
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      pairs.push([players[i], players[j]])
    }
  }

  // 2) build all possible matches (two pairs)
  type InternalMatch = { teamA: Player[]; teamB: Player[]; score: number }
  const matches: InternalMatch[] = []

  for (let i = 0; i < pairs.length; i++) {
    const [a1, a2] = pairs[i]
    for (let j = i + 1; j < pairs.length; j++) {
      const [b1, b2] = pairs[j]

      // skip if any player repeats
      const idsA = new Set([a1.id, a2.id])
      if (idsA.has(b1.id) || idsA.has(b2.id)) continue

      // α: calculate individual skill imbalances
      const diff1 = Math.abs(a1.level - b1.level) + Math.abs(a2.level - b2.level)
      const diff2 = Math.abs(a1.level - b2.level) + Math.abs(a2.level - b1.level)
      const skillImbalance = Math.min(diff1, diff2)

      // α: calculate team total skill difference
      const totalA = a1.level + a2.level
      const totalB = b1.level + b2.level
      const teamImbalance = Math.abs(totalA - totalB)

      // β: sum of matches already played by all four
      const sumMatchCounts =
        (matchCounts.get(a1.id) || 0) +
        (matchCounts.get(a2.id) || 0) +
        (matchCounts.get(b1.id) || 0) +
        (matchCounts.get(b2.id) || 0)

      // γ: sum of past partnership counts for each team
      const pastPairA = partnerCounts.get(a1.id)?.get(a2.id) || 0
      const pastPairB = partnerCounts.get(b1.id)?.get(b2.id) || 0
      const sumPartnerCounts = pastPairA + pastPairB

      // final score: lower is more balanced and more likely selected
      const score = skillImbalance + alpha * teamImbalance + beta * sumMatchCounts + gamma * sumPartnerCounts

      matches.push({ teamA: [a1, a2], teamB: [b1, b2], score })
    }
  }

  // 3) randomize order to break ties
  shuffle(matches)

  // 4) sort by ascending score (best matches first)
  matches.sort((m1, m2) => m1.score - m2.score)

  // 5) pick top matches without player reuse
  const selected: InternalMatch[] = []
  const usedIds = new Set<string>()
  for (const m of matches) {
    if (selected.length >= courts) break
    const ids = [...m.teamA, ...m.teamB].map((p) => p.id)
    if (ids.some((id) => usedIds.has(id))) continue
    ids.forEach((id) => usedIds.add(id))
    selected.push(m)
  }

  // return only the team arrays for the round
  return { matches: selected.map(({ teamA, teamB }) => ({ teamA, teamB })) }
}
