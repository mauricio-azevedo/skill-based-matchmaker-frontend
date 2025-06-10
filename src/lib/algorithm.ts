// ============================================================================
// src/lib/algorithm.ts – Fair-first 2-v-2 generator (v8-comentado)
// ---------------------------------------------------------------------------
// Prioridade dos critérios na formação de equipes dentro de cada quarteto:
//
//   #1  Diferença mínima de nível médio entre Team A e Team B
//   #2  Menor “score de parceria” = vezes que (p1,p2) já formaram dupla
//   #3  Ordem determinística (resolve empates restantes)
//
// Regras globais (inalteradas):
//   • Diferença de partidas disputadas ≤ 1 ao final da rodada
//   • Todos que estavam no menor nº de partidas (min0) jogam pelo menos 1x
// ============================================================================
import type { Player } from '../context/PlayersContext'

// --------- Tipos auxiliares ---------
export type Team = [Player, Player]
export interface Match {
  teamA: Team
  teamB: Team
}
export type PlayedMap = Record<string, number> // id → partidas
export type PartnerCountMap = Record<string, number> // "a|b" → vezes

const PLAYERS_PER_MATCH = 4 as const
const avg = (t: Team) => (t[0].level + t[1].level) / 2
const key = (a: Player, b: Player) => (a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`) // id ordenado

/**
 * Gera partidas obedecendo às regras acima.
 *
 * @param players       – lista de jogadores disponíveis
 * @param played        – mapa mutável id → nº de partidas (persiste entre chamadas)
 * @param partnerCount  – mapa mutável "a|b" → vezes parceiros (persiste entre chamadas)
 */
export function generateMatches(
  players: Player[],
  played: PlayedMap = {},
  partnerCount: PartnerCountMap = {},
): { matches: Match[]; played: PlayedMap; partnerCount: PartnerCountMap } {
  // 1 ─── normaliza contadores
  for (const p of players) played[p.id] ??= 0

  const matches: Match[] = []
  const min0 = Math.min(...players.map((p) => played[p.id]))

  // 2 ─── gera quartetos até zerarmos todos os “atrasados” (min0)
  while (players.some((p) => played[p.id] === min0)) {
    const needers = players.filter((p) => played[p.id] === min0)
    const extras = players.filter((p) => played[p.id] === min0 + 1)

    // monta quarteto
    const q: Player[] = needers.slice(0, PLAYERS_PER_MATCH)
    if (q.length < PLAYERS_PER_MATCH) {
      const need = PLAYERS_PER_MATCH - q.length
      if (extras.length < need) break // manter diff ≤ 1
      q.push(...extras.slice(0, need))
    }

    // 3 ─── avalia as 3 divisões possíveis
    q.sort((a, b) => a.level - b.level) // garantia de determinismo
    const opts: Match[] = [
      { teamA: [q[0], q[1]], teamB: [q[2], q[3]] },
      { teamA: [q[0], q[2]], teamB: [q[1], q[3]] },
      { teamA: [q[0], q[3]], teamB: [q[1], q[2]] },
    ]

    let best = opts[0]
    let bestLvlDiff = Math.abs(avg(best.teamA) - avg(best.teamB))
    let bestPairScore = (partnerCount[key(...best.teamA)] ?? 0) + (partnerCount[key(...best.teamB)] ?? 0)

    for (const m of opts.slice(1)) {
      const lvlDiff = Math.abs(avg(m.teamA) - avg(m.teamB))
      if (lvlDiff > bestLvlDiff) continue // pior no critério #1

      const pairScore = (partnerCount[key(...m.teamA)] ?? 0) + (partnerCount[key(...m.teamB)] ?? 0)

      if (
        lvlDiff < bestLvlDiff || // melhor no #1  → aceita
        (lvlDiff === bestLvlDiff && // empata no #1
          pairScore < bestPairScore) // melhor no #2  → aceita
      ) {
        best = m
        bestLvlDiff = lvlDiff
        bestPairScore = pairScore
      }
    }

    matches.push(best)

    // 4 ─── atualiza contadores
    for (const p of [...best.teamA, ...best.teamB]) played[p.id] += 1
    partnerCount[key(...best.teamA)] = (partnerCount[key(...best.teamA)] ?? 0) + 1
    partnerCount[key(...best.teamB)] = (partnerCount[key(...best.teamB)] ?? 0) + 1
  }

  return { matches, played, partnerCount }
}
