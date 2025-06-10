// ============================================================================
// src/lib/algorithm.ts – Coração da lógica de balanceamento
// ============================================================================
import type { Player } from '../context/PlayersContext.tsx'

// Tipagens auxiliares – simplificam leitura em outros módulos.
export interface Team extends Array<Player> {}
export interface Match {
  teamA: Team
  teamB: Team
}

/**
 * Mapa id → nº de partidas – mantém histórico de uso para priorizar quem jogou
 * menos.  Mantido fora de Player para não sujar UI com dados de sessão.
 */
export type PlayedMap = Record<string, number>

/**
 * Gera partidas equilibradas por nível:
 *   – Cada partida contém dois times (A/B) com o MESMO multiconjunto de níveis.
 *   – Exemplo: teamSize=2 → [1,2] vs [1,2].
 *   – Jogadores "solteiros" são pareados reutilizando quem jogou menos.
 *
 * Retorna { matches, played } onde played já vem incrementado.
 */
export function generateMatches(
  players: Player[],
  teamSize = 2,
  played: PlayedMap = {},
): { matches: Match[]; played: PlayedMap } {
  // -------------------------------------------------------------------------
  // 1. Normaliza played: garante entrada para todo jogador.
  // -------------------------------------------------------------------------
  for (const p of players) {
    if (played[p.id] == null) played[p.id] = 0
  }

  // -------------------------------------------------------------------------
  // 2. Agrupa jogadores por nível e ordena cada fila por quem jogou menos.
  //    Isso torna a escolha greedy simples e justa.
  // -------------------------------------------------------------------------
  const byLevel: Record<number, Player[]> = {}
  for (const p of players) {
    ;(byLevel[p.level] ??= []).push(p)
  }
  for (const queue of Object.values(byLevel)) {
    queue.sort((a, b) => played[a.id] - played[b.id])
  }

  type Pair = { level: number; a: Player; b: Player }
  const pairs: Pair[] = [] // pares formados (um p/ cada time)
  const singles: Player[] = [] // jogadores sobrando em cada nível

  // -------------------------------------------------------------------------
  // 3. Dentro de cada nível, forma pares A/B até não der mais.
  // -------------------------------------------------------------------------
  for (const [lvl, queue] of Object.entries(byLevel)) {
    while (queue.length >= 2) {
      const a = queue.shift()! // menor contador first
      const b = queue.shift()!
      pairs.push({ level: +lvl, a, b })
    }
    if (queue.length) singles.push(queue.shift()!) // sobrou 1 → marcar para reuse
  }

  // -------------------------------------------------------------------------
  // 4. Garante que singles também joguem: cria par reutilizando quem jogou menos
  //    no mesmo nível (pode duplicar uso de alguém, mas mantendo equilíbrio).
  // -------------------------------------------------------------------------
  for (const s of singles) {
    const candidato = players
      .filter((p) => p.level === s.level && p.id !== s.id)
      .sort((x, y) => played[x.id] - played[y.id])[0]

    if (candidato) {
      pairs.push({ level: s.level, a: s, b: candidato })
    }
  }

  // -------------------------------------------------------------------------
  // 5. Se nº de pares não fecha múltiplo de teamSize, cria pares extras
  //    reutilizando gente que jogou menos no nível mais "populoso".
  // -------------------------------------------------------------------------
  while (pairs.length % teamSize !== 0) {
    const levelWithMost = Object.entries(byLevel).sort(([, a], [, b]) => b.length - a.length)[0]?.[0]
    if (levelWithMost == null) break // sem dados extremos, deve raro

    const baseLevel = +levelWithMost
    const candidatos = players.filter((p) => p.level === baseLevel).sort((x, y) => played[x.id] - played[y.id])

    if (candidatos.length >= 2) {
      pairs.push({ level: baseLevel, a: candidatos[0], b: candidatos[1] })
    } else {
      break // não há mais como completar – sairá com partidas a menos
    }
  }

  // -------------------------------------------------------------------------
  // 6. Transforma pares em partidas.  Cada partida precisa de teamSize pares.
  //    Exemplos:
  //      teamSize = 1 → (a,b) já forma uma partida
  //      teamSize = 2 → usa 2 pares: (a1,b1)+(a2,b2) -> [a1,a2] vs [b1,b2]
  // -------------------------------------------------------------------------
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

  // -------------------------------------------------------------------------
  // 7. Incrementa contagem de jogos de todo mundo que apareceu em matches.
  // -------------------------------------------------------------------------
  for (const { teamA, teamB } of matches) {
    for (const p of [...teamA, ...teamB]) {
      played[p.id] += 1
    }
  }

  return { matches, played }
}
