// src/lib/algorithm.ts
// -----------------------------------------------------------------------------
// Gera partidas equilibradas por nível. Cada partida contém dois times de
// tamanho `teamSize` com a *mesma* multiconjunto de níveis (ex.: [1,2] vs [1,2]).
// A função devolve também o mapa `played` já atualizado, permitindo que chamadas
// subsequentes priorizem quem jogou menos.
// -----------------------------------------------------------------------------

import type { Player } from '../context/PlayersContext.tsx'

export interface Team extends Array<Player> {}
export interface Match {
  teamA: Team
  teamB: Team
}

/**
 * Quantas partidas cada jogador já disputou.  Mantido fora de `Player` para não
 * poluir o contexto global; persista em localStorage ou num provider, se quiser.
 */
export type PlayedMap = Record<string, number>

/**
 * Gera o número mínimo de partidas necessárias para que *todo* jogador atue
 * pelo menos uma vez — reaproveitando alguém quando o total não fecha.
 *
 * `players` ‑ lista de todos os jogadores cadastrados.
 * `teamSize` ‑ tamanho de cada time (padrão: 2).
 * `played`   ‑ contagem pré‑existente de partidas por jogador.
 *
 * Retorna `{ matches, played }`, onde `played` já vem incrementado.
 */
export function generateMatches(
  players: Player[],
  teamSize = 2,
  played: PlayedMap = {},
): { matches: Match[]; played: PlayedMap } {
  // ---------------------------------------------------------------------------
  // 1. Normaliza o mapa de partidas jogadas
  // ---------------------------------------------------------------------------
  for (const p of players) {
    if (played[p.id] == null) played[p.id] = 0
  }

  // ---------------------------------------------------------------------------
  // 2. Agrupa por nível e ordena cada fila por quem jogou menos
  // ---------------------------------------------------------------------------
  const byLevel: Record<number, Player[]> = {}
  for (const p of players) {
    ;(byLevel[p.level] ??= []).push(p)
  }
  for (const queue of Object.values(byLevel)) {
    queue.sort((a, b) => played[a.id] - played[b.id])
  }

  type Pair = { level: number; a: Player; b: Player }
  const pairs: Pair[] = []
  const singles: Player[] = []

  // ---------------------------------------------------------------------------
  // 3. Dentro de cada nível, forma pares (um pra cada time)
  // ---------------------------------------------------------------------------
  for (const [lvl, queue] of Object.entries(byLevel)) {
    while (queue.length >= 2) {
      const a = queue.shift()!
      const b = queue.shift()!
      pairs.push({ level: +lvl, a, b })
    }
    if (queue.length) singles.push(queue.shift()!) // sobrou 1 desse nível
  }

  // ---------------------------------------------------------------------------
  // 4. Garante que jogadores "solteiros" também atuem: cria par reaproveitando
  //    quem jogou menos nesse mesmo nível
  // ---------------------------------------------------------------------------
  for (const s of singles) {
    // procura alguém do mesmo nível que tenha jogado menos vezes
    const candidato = players
      .filter((p) => p.level === s.level && p.id !== s.id)
      .sort((x, y) => played[x.id] - played[y.id])[0]

    if (candidato) {
      pairs.push({ level: s.level, a: s, b: candidato })
    }
  }

  // ---------------------------------------------------------------------------
  // 5. Se o nº de pares ainda não for múltiplo de teamSize, cria pares extras
  //    (reutilizando gente que jogou menos) até fechar.
  // ---------------------------------------------------------------------------
  while (pairs.length % teamSize !== 0) {
    // Escolhe o nível com mais jogadores disponíveis (heurística simples)
    const levelWithMost = Object.entries(byLevel).sort(([, a], [, b]) => b.length - a.length)[0]?.[0]

    if (levelWithMost == null) break // deveria ser raríssimo

    const baseLevel = +levelWithMost
    const candidatos = players.filter((p) => p.level === baseLevel).sort((x, y) => played[x.id] - played[y.id])

    if (candidatos.length >= 2) {
      pairs.push({ level: baseLevel, a: candidatos[0], b: candidatos[1] })
    } else {
      break // não há mais como completar; sai com pares a menos mesmo
    }
  }

  // ---------------------------------------------------------------------------
  // 6. Converte pares em partidas: cada partida requer `teamSize` pares.
  // ---------------------------------------------------------------------------
  const matches: Match[] = []
  for (let i = 0; i + teamSize - 1 < pairs.length; i += teamSize) {
    const teamA: Team = []
    const teamB: Team = []
    for (let j = 0; j < teamSize; j++) {
      const { a, b } = pairs[i + j]
      teamA.push(a)
      teamB.push(b)
    }
    matches.push({ teamA, teamB })
  }

  // ---------------------------------------------------------------------------
  // 7. Atualiza contagem de partidas jogadas.
  // ---------------------------------------------------------------------------
  for (const { teamA, teamB } of matches) {
    for (const p of [...teamA, ...teamB]) {
      played[p.id] += 1
    }
  }

  return { matches, played }
}
