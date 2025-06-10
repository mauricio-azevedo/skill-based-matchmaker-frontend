import type { Player, Round } from '../types/players'

/**
 * Embaralha um array no lugar usando o algoritmo de Fisher-Yates.
 */
function shuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

/**
 * Gera um único round balanceado, tentando equalizar:
 *  - níveis individuais e totais (α)
 *  - diferença de jogos já disputados (β)
 *
 * @param players lista de todos os jogadores
 * @param courts quantas quadras (matches) selecionar
 * @param matchCounts map de id->quantas partidas já jogou
 */
export function generateSchedule(players: Player[], courts: number, matchCounts: Map<string, number>): Round {
  if (players.length < 4) {
    throw new Error('É preciso ao menos 4 jogadores para gerar o cronograma.')
  }

  // constantes de peso
  const alpha = 2 // peso para diferença de duplas
  const beta = 1 // peso para desigualdade de número de jogos

  // 1) todas as duplas
  const pairs: [Player, Player][] = []
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      pairs.push([players[i], players[j]])
    }
  }

  // 2) montar partidas possíveis (sem repetir jogador)
  type InternalMatch = {
    teamA: Player[]
    teamB: Player[]
    score: number
  }
  const matches: InternalMatch[] = []

  for (let i = 0; i < pairs.length; i++) {
    const [a1, a2] = pairs[i]
    for (let j = i + 1; j < pairs.length; j++) {
      const [b1, b2] = pairs[j]

      // pular se algum jogador se repete
      const idsA = new Set([a1.id, a2.id])
      if (idsA.has(b1.id) || idsA.has(b2.id)) continue

      // α: imbalance de skill
      const diff1 = Math.abs(a1.level - b1.level) + Math.abs(a2.level - b2.level)
      const diff2 = Math.abs(a1.level - b2.level) + Math.abs(a2.level - b1.level)
      const vi = Math.min(diff1, diff2)

      const totalA = a1.level + a2.level
      const totalB = b1.level + b2.level
      const vt = Math.abs(totalA - totalB)

      // β: soma de partidas já disputadas pelos 4
      const sumCounts =
        (matchCounts.get(a1.id) || 0) +
        (matchCounts.get(a2.id) || 0) +
        (matchCounts.get(b1.id) || 0) +
        (matchCounts.get(b2.id) || 0)

      const score = vi + alpha * vt + beta * sumCounts

      matches.push({ teamA: [a1, a2], teamB: [b1, b2], score })
    }
  }

  // 3) randomizar
  shuffle(matches)

  // 4) ordenar por score
  matches.sort((m1, m2) => m1.score - m2.score)

  // 5) escolher as melhores quadras sem repetir jogadores
  const selected: InternalMatch[] = []
  const usedIds = new Set<string>()
  for (const m of matches) {
    if (selected.length >= courts) break
    const ids = [...m.teamA, ...m.teamB].map((p) => p.id)
    if (ids.some((id) => usedIds.has(id))) continue
    ids.forEach((id) => usedIds.add(id))
    selected.push(m)
  }

  return {
    matches: selected.map(({ teamA, teamB }) => ({ teamA, teamB })),
  }
}
