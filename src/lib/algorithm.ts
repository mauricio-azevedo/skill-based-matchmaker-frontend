// ============================================================================
// src/lib/algorithm.ts – Coração da lógica de balanceamento
// ----------------------------------------------------------------------------
// Alterações nesta revisão:
//   • remove o parâmetro `teamSize`; o algoritmo agora gera APENAS partidas 2‑v‑2.
//   • simplificação de variáveis e loops para priorizar clareza.
//   • comentários revisados para serem mais objetivos.
//
// Resultado: para cada sorteio, cada jogador aparece no mapa `played` apenas
// uma vez por partida disputada, garantindo distribuição justa.
// ============================================================================
import type { Player } from '../context/PlayersContext.tsx'

// ----------------------
// Tipos auxiliares
// ----------------------
export type Team = [Player, Player] // exatamente 2 jogadores
export interface Match {
  teamA: Team
  teamB: Team
}

/**
 * Mapa id → nº de partidas – mantém histórico de uso para priorizar quem jogou
 * menos.  Mantido fora de Player para não misturar dados de UI com sessão.
 */
export type PlayedMap = Record<string, number>

/**
 * Gera partidas 2‑v‑2 equilibradas por nível (`Player.level`):
 *
 *  • Em cada nível, cria pares (A,B) com o MESMO multiconjunto de níveis.
 *  • Singles (jogadores sobrando) são pareados reutilizando quem jogou menos.
 *  • Retorna `{ matches, played }` onde `played` já vem incrementado.
 *
 * A cada chamada considera o histórico acumulado em `played`, permitindo
 * várias rodadas sem reinicializar contadores.
 */
export function generateMatches(players: Player[], played: PlayedMap = {}): { matches: Match[]; played: PlayedMap } {
  // -----------------------------------------------------------------------
  // 1. Normaliza `played` – garante entrada para todo jogador.
  // -----------------------------------------------------------------------
  for (const p of players) {
    if (played[p.id] == null) played[p.id] = 0
  }

  // Helper: marca uso IMEDIATO de um jogador para esta rodada.
  const markUsed = (p: Player) => void (played[p.id] += 1)

  // -----------------------------------------------------------------------
  // 2. Agrupa por nível e ordena cada fila por quem jogou menos.
  // -----------------------------------------------------------------------
  const byLevel: Record<number, Player[]> = {}
  for (const p of players) (byLevel[p.level] ??= []).push(p)

  for (const queue of Object.values(byLevel)) {
    queue.sort((a, b) => played[a.id] - played[b.id])
  }

  // -----------------------------------------------------------------------
  // 3. Forma pares (A,B) dentro de cada nível.
  // -----------------------------------------------------------------------
  type Pair = { level: number; a: Player; b: Player }
  const pairs: Pair[] = []
  const singles: Player[] = []

  for (const [level, queue] of Object.entries(byLevel)) {
    while (queue.length >= 2) {
      const a = queue.shift()!
      const b = queue.shift()!
      pairs.push({ level: +level, a, b })
      markUsed(a)
      markUsed(b)
    }
    if (queue.length) singles.push(queue.shift()!)
  }

  // -----------------------------------------------------------------------
  // 4. Faz singles jogarem – reutiliza quem jogou menos no mesmo nível.
  // -----------------------------------------------------------------------
  for (const s of singles) {
    const cand = players
      .filter((p) => p.level === s.level && p.id !== s.id)
      .sort((x, y) => played[x.id] - played[y.id])[0]

    if (!cand) continue
    pairs.push({ level: s.level, a: s, b: cand })
    markUsed(s)
    markUsed(cand)
  }

  // -----------------------------------------------------------------------
  // 5. Garante número par de pares (necessário para formar 2‑v‑2).
  //    Se ímpar, cria par extra com menor‐uso do nível mais populoso.
  // -----------------------------------------------------------------------
  while (pairs.length % 2 !== 0) {
    const [lvl] = Object.entries(byLevel).sort(([, a], [, b]) => b.length - a.length)[0] ?? []
    if (lvl == null) break

    const cand = players.filter((p) => p.level === +lvl).sort((x, y) => played[x.id] - played[y.id])

    if (cand.length >= 2) {
      pairs.push({ level: +lvl, a: cand[0], b: cand[1] })
      markUsed(cand[0])
      markUsed(cand[1])
    } else break
  }

  // -----------------------------------------------------------------------
  // 6. Converte pares em partidas (2 pares = 1 partida 2‑v‑2).
  // -----------------------------------------------------------------------
  const matches: Match[] = []
  for (let i = 0; i + 1 < pairs.length; i += 2) {
    const { a: a1, b: b1 } = pairs[i]
    const { a: a2, b: b2 } = pairs[i + 1]
    matches.push({ teamA: [a1, a2], teamB: [b1, b2] })
  }

  return { matches, played }
}
