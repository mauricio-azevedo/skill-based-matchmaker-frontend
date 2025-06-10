// ============================================================================
// src/lib/algorithm.ts – Fair-first 2-v-2 generator (v7-comentado)
// ---------------------------------------------------------------------------
// Regras de negócio seguidas:
//   1. Ninguém pode terminar a rodada com MAIS de uma partida de diferença
//      em relação ao jogador com menos partidas.
//   2. Todos os jogadores que estão no menor número de partidas (min0)
//      PRECISAM jogar pelo menos uma vez nesta rodada.
//   3. Dentro de cada quarteto, dividimos as equipes para minimizar
//      a diferença média de nível entre Team A e Team B.
// ============================================================================
import type { Player } from '../context/PlayersContext'

// --------- Tipos auxiliares ---------
export type Team = [Player, Player] // dupla exatamente 2 jogadores
export interface Match {
  teamA: Team
  teamB: Team
}
export type PlayedMap = Record<string, number> // id → nº de partidas

const PLAYERS_PER_MATCH = 4 as const
const avgLevel = (t: Team) => (t[0].level + t[1].level) / 2

/**
 * Gera partidas 2-v-2 seguindo as regras descritas acima.
 *
 * @param players – lista de jogadores disponíveis nesta rodada
 * @param played  – mapa mutável id → nº de partidas já disputadas até aqui
 * @return        – { matches, played } onde played vem incrementado
 */
export function generateMatches(players: Player[], played: PlayedMap = {}): { matches: Match[]; played: PlayedMap } {
  // -------------------------------------------------------------------------
  // 1. Garante que todo jogador tenha contador inicializado
  // -------------------------------------------------------------------------
  for (const p of players) played[p.id] ??= 0

  const matches: Match[] = []
  const min0 = Math.min(...players.map((p) => played[p.id])) // menor contagem atual

  // -------------------------------------------------------------------------
  // 2. Enquanto ainda existir alguém com played === min0,
  //    formamos novos quartetos.
  // -------------------------------------------------------------------------
  while (players.some((p) => played[p.id] === min0)) {
    // 2.1 Jogadores “atrasados” (ainda no mínimo absoluto)
    const needers = players.filter((p) => played[p.id] === min0)

    // 2.2 Jogadores elegíveis como “extras” (min0 + 1 partida)
    const extras = players.filter((p) => played[p.id] === min0 + 1)

    // 2.3 Escolhe até quatro needers; se faltar completa com extras.
    const quartet: Player[] = needers.slice(0, PLAYERS_PER_MATCH)
    if (quartet.length < PLAYERS_PER_MATCH) {
      const vagas = PLAYERS_PER_MATCH - quartet.length
      if (extras.length < vagas) break // Faltam extras → violaria regra #1
      quartet.push(...extras.slice(0, vagas))
    }

    // -----------------------------------------------------------------------
    // 3. Escolhe o split mais equilibrado por nível
    //    Há apenas 3 divisões exclusivas possíveis para um quarteto.
    // -----------------------------------------------------------------------
    quartet.sort((a, b) => a.level - b.level) // ordena p/ determinismo

    const possibilidades: Match[] = [
      { teamA: [quartet[0], quartet[1]], teamB: [quartet[2], quartet[3]] },
      { teamA: [quartet[0], quartet[2]], teamB: [quartet[1], quartet[3]] },
      { teamA: [quartet[0], quartet[3]], teamB: [quartet[1], quartet[2]] },
    ]

    let melhor = possibilidades[0]
    let menorDif = Math.abs(avgLevel(melhor.teamA) - avgLevel(melhor.teamB))

    for (const m of possibilidades.slice(1)) {
      const dif = Math.abs(avgLevel(m.teamA) - avgLevel(m.teamB))
      if (dif < menorDif) {
        melhor = m
        menorDif = dif
      }
    }

    matches.push(melhor)

    // -----------------------------------------------------------------------
    // 4. Incrementa o contador dos quatro participantes
    //    • needers sobem de min0 → min0 + 1
    //    • extras sobem de min0 + 1 → min0 + 2
    //      ⇒ diferença global continua ≤ 1
    // -----------------------------------------------------------------------
    for (const p of quartet) played[p.id] += 1
  }

  return { matches, played }
}
