// ============================================================================
// src/lib/algorithm.ts – geração de partidas 2×2 com:
//   • cobertura de duplas (quando possível)
//   • balanceamento de níveis entre times (ideal/aceitável)
//   • remoção de jogos muito desbalanceados (score ≥ 2)
//   • *pós*-ajuste para que todos os jogadores terminem com a mesma quantidade
//     de partidas – ou, na pior hipótese, apenas **uma** partida a mais que
//     o mínimo observado.
// ============================================================================
import type { Player } from '../context/PlayersContext'

/** Cada partida contém dois times de dois jogadores. */
export type Match = {
  teamA: Player[]
  teamB: Player[]
}

// ---------------------------------------------------------------------------
// Utilidades internas
// ---------------------------------------------------------------------------
const pairKey = (a: Player, b: Player) => (a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`)
const levelKey = (p: Player) => p.level

/** Score de equilíbrio entre dois times 2×2.
 *  0 → multiset de níveis idêntico (ideal)
 *  1 → soma das diferenças absolutas ≤ 1  (aceitável)
 *  2 → qualquer coisa maior                (ruim) – evitado/​removido
 */
const pairScore = (a: [Player, Player], b: [Player, Player]): number => {
  const la = [levelKey(a[0]), levelKey(a[1])].sort((x, y) => x - y)
  const lb = [levelKey(b[0]), levelKey(b[1])].sort((x, y) => x - y)
  if (la[0] === lb[0] && la[1] === lb[1]) return 0
  const diff = Math.abs(la[0] - lb[0]) + Math.abs(la[1] - lb[1])
  return diff <= 1 ? 1 : 2
}

const overlap = (pair: [Player, Player], team: [Player, Player]) =>
  pair[0].id === team[0].id || pair[0].id === team[1].id || pair[1].id === team[0].id || pair[1].id === team[1].id

// ---------------------------------------------------------------------------
// Estatísticas auxiliares
// ---------------------------------------------------------------------------

/** Conta quantas partidas cada jogador participou. */
const countMatches = (matches: Match[]): Map<Player['id'], number> => {
  const counts = new Map<Player['id'], number>()
  for (const { teamA, teamB } of matches) {
    for (const p of [...teamA, ...teamB]) {
      counts.set(p.id, (counts.get(p.id) ?? 0) + 1)
    }
  }
  return counts
}

// ---------------------------------------------------------------------------
//  ⌁ balanceEvenParticipation – remove partidas de quem tem “sobras” ⌁
// ---------------------------------------------------------------------------
/**
 * Garante que ninguém jogue mais de **uma** partida além do mínimo observado.
 *
 * Estratégia:
 *   • enquanto maxCount − minCount > 1:
 *       1. identifique jogadores no grupo de maxCount;
 *       2. procure partida que envolva pelo menos **um** desses jogadores e
 *          **nenhum** do grupo minCount;
 *       3. escolha a partida menos equilibrada (score 1 antes de 0) para
 *          minimizar impacto, depois remova-a e atualize contagens.
 *
 *   • se não houver partida elegível → não faz mais nada (já atingimos limite
 *     ou nenhum ajuste possível sem tocar quem tem o mínimo).
 */
const balanceEvenParticipation = (matches: Match[]): Match[] => {
  const mutable = [...matches] // cópia mutável
  let counts = countMatches(mutable)

  const getMinMax = () => {
    const vals = [...counts.values()]
    return { min: Math.min(...vals), max: Math.max(...vals) }
  }

  // ————————————————————————————————————————————————————————————————
  while (true) {
    const { min, max } = getMinMax()
    if (max - min <= 1) break // já equilibrado

    const maxPlayers = new Set([...counts.entries()].filter(([, n]) => n === max).map(([id]) => id))
    const minPlayers = new Set([...counts.entries()].filter(([, n]) => n === min).map(([id]) => id))

    // Filtra partidas elegíveis: contém alguém do maxPlayers e ninguém do minPlayers
    type ScoredMatch = { idx: number; score: number }
    const candidates: ScoredMatch[] = []
    mutable.forEach((m, idx) => {
      const playersIds = [...m.teamA, ...m.teamB].map((p) => p.id)
      const hasMax = playersIds.some((id) => maxPlayers.has(id))
      const hasMin = playersIds.some((id) => minPlayers.has(id))
      if (hasMax && !hasMin) {
        const score = pairScore(m.teamA as [Player, Player], m.teamB as [Player, Player])
        candidates.push({ idx, score })
      }
    })

    if (!candidates.length) break // nenhum jogo removível sem afetar mínimos

    // Ordena: preferir remover score 1 depois score 0
    candidates.sort((a, b) => b.score - a.score) // 1 > 0, ambos < 2 (já filtrado)

    // Remove a primeira
    const { idx } = candidates[0]
    mutable.splice(idx, 1)
    // Recalcula contagens — mais barato que atualizar manualmente
    counts = countMatches(mutable)
  }

  return mutable
}

// ---------------------------------------------------------------------------
// Função principal – geração de partidas
// ---------------------------------------------------------------------------
export function generateMatches(players: Player[]): Match[] {
  if (players.length < 4) return []

  // 1. Conjunto de duplas ainda não cobertas (map<key, pair>)
  const uncovered = new Map<string, [Player, Player]>()
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      uncovered.set(pairKey(players[i], players[j]), [players[i], players[j]])
    }
  }

  const matches: Match[] = []

  // 2. Geração gananciosa cobrindo (até) duas duplas por iteração
  while (uncovered.size) {
    // 2.1 primeira dupla não coberta → teamA
    const [, teamA] = uncovered.entries().next().value as [string, [Player, Player]]
    uncovered.delete(pairKey(teamA[0], teamA[1]))

    // 2.2 procura melhor dupla disjunta → teamB
    let bestKey: string | null = null
    let bestPair: [Player, Player] | null = null
    let bestScore = Infinity

    for (const [key, pair] of uncovered.entries()) {
      if (overlap(pair, teamA)) continue
      const s = pairScore(teamA, pair)
      if (s < bestScore) {
        bestScore = s
        bestKey = key
        bestPair = pair
        if (s === 0) break // já é ideal
      }
    }

    let teamB: [Player, Player]
    if (bestPair && bestKey) {
      teamB = bestPair
      uncovered.delete(bestKey)
    } else {
      // Fallback: usa primeiros dois disponíveis que não estejam em teamA, ou repete A.
      const others = players.filter((p) => p.id !== teamA[0].id && p.id !== teamA[1].id)
      teamB = others.length >= 2 ? [others[0], others[1]] : [teamA[0], teamA[1]]
    }

    matches.push({ teamA, teamB })
  }

  // 3. Remove partidas cuja variação de níveis seja ≥ 2
  const filtered = matches.filter((m) => pairScore(m.teamA as [Player, Player], m.teamB as [Player, Player]) < 2)

  // 4. Balanceia participação – equaliza ou deixa diferença ≤ 1
  return balanceEvenParticipation(filtered)
}
