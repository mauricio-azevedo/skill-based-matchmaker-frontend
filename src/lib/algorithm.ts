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
 * Seleciona um único round de partidas balanceadas,
 * escolhendo as `courts` partidas com menor score sem jogadores repetidos.
 */
export function generateSchedule(players: Player[], courts: number): Round {
  if (players.length < 4) {
    throw new Error('É preciso ao menos 4 jogadores para gerar o cronograma.')
  }

  // 1) gerar todas as duplas (combinação de 2 em 2)
  const pairs: [Player, Player][] = []
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      pairs.push([players[i], players[j]])
    }
  }

  // 2) montar todas as partidas possíveis (dupla vs dupla, sem jogadores repetidos)
  type InternalMatch = { teamA: Player[]; teamB: Player[]; score: number }
  const matches: InternalMatch[] = []
  const alpha = 2

  for (let i = 0; i < pairs.length; i++) {
    const [a1, a2] = pairs[i]
    for (let j = i + 1; j < pairs.length; j++) {
      const [b1, b2] = pairs[j]

      // descartar se houver jogador em comum
      const idsA = new Set([a1.id, a2.id])
      if (idsA.has(b1.id) || idsA.has(b2.id)) continue

      // vi: mínimo entre as duas formas de emparelhar os níveis
      const diff1 = Math.abs(a1.level - b1.level) + Math.abs(a2.level - b2.level)
      const diff2 = Math.abs(a1.level - b2.level) + Math.abs(a2.level - b1.level)
      const vi = Math.min(diff1, diff2)

      // vt: diferença dos totais das duplas
      const totalA = a1.level + a2.level
      const totalB = b1.level + b2.level
      const vt = Math.abs(totalA - totalB)

      matches.push({ teamA: [a1, a2], teamB: [b1, b2], score: vi + alpha * vt })
    }
  }

  // 3) embaralhar partidas para randomizar desempates em scores iguais
  shuffle(matches)

  // 4) ordenar pelo score (menor primeiro)
  matches.sort((m1, m2) => m1.score - m2.score)

  // 5) selecionar as `courts` primeiras partidas sem jogadores repetidos
  const selected: InternalMatch[] = []
  const usedIds = new Set<string>()

  for (const m of matches) {
    if (selected.length >= courts) break
    const ids = m.teamA.concat(m.teamB).map((p) => p.id)
    if (ids.some((id) => usedIds.has(id))) continue
    ids.forEach((id) => usedIds.add(id))
    selected.push(m)
  }

  return {
    matches: selected.map(({ teamA, teamB }) => ({ teamA, teamB })),
  }
}
