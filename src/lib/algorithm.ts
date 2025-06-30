// src/lib/algorithm.ts
import type { Player, UnsavedRound } from '@/types/players'

/* ─────────────────────────────── Constantes ──────────────────────────────── */

const MIN_PLAYERS = 4 as const

/** Pesos já na mesma ordem de grandeza dos fatores normalizados */
const WEIGHT = {
  PARTNER_COUNT: 99,
  SKILL_IMBALANCE: 20,
  MATCH_COUNT_IMBALANCE: 99,
  PREFERRED_PAIR: 1.9,
  WITHIN_TEAM_VARIATION: 0,
  MATCH_COUNT_TOTAL: 99,
} as const

/* ────────────────────────────── Tipos Internos ───────────────────────────── */

type IdxPair = readonly [number, number]

interface InternalMatch {
  teamA: IdxPair
  teamB: IdxPair
  score: number
}

/* ──────────────────────────── Funções utilitárias ────────────────────────── */

/** Gera todas as combinações únicas de índices (i < j). O(n²). */
function generateIndexPairs(count: number): IdxPair[] {
  const pairs: IdxPair[] = []
  for (let i = 0; i < count - 1; i++) {
    for (let j = i + 1; j < count; j++) {
      pairs.push([i, j])
    }
  }
  return pairs
}

/** Atalho para obter `partnerCounts[id]` devolvendo 0 se inexistente. */
function getPartnerCount(p: Player, partnerId: string): number {
  return (p.partnerCounts && p.partnerCounts[partnerId]) || 0
}

/** Pré‑processa players para lookup O(1) em pares preferidos. */
function buildPreferredSet(players: readonly Player[]): ReadonlyArray<Set<string>> {
  return players.map((p) => new Set(p.preferredPairs ?? []))
}

/* ────────────────────── Cálculo do score normalizado ─────────────────────── */

function calculateMatchScore(
  players: readonly Player[],
  prefSets: ReadonlyArray<Set<string>>,
  a1: number,
  a2: number,
  b1: number,
  b2: number,
): number {
  const pA1 = players[a1]
  const pA2 = players[a2]
  const pB1 = players[b1]
  const pB2 = players[b2]

  // 1) Desequilíbrio de habilidade (entre duplas e total)
  const diff1 = Math.abs(pA1.level - pB1.level) + Math.abs(pA2.level - pB2.level)
  const diff2 = Math.abs(pA1.level - pB2.level) + Math.abs(pA2.level - pB1.level)
  const skillPairImbalance = Math.min(diff1, diff2)

  const teamImbalance = Math.abs(pA1.level + pA2.level - (pB1.level + pB2.level))

  const withinTeamVariation = Math.abs(pA1.level - pA2.level) + Math.abs(pB1.level - pB2.level)

  // 2) Volume e equilíbrio de partidas jogadas
  const playedSum = pA1.matchCount + pA2.matchCount + pB1.matchCount + pB2.matchCount

  const matchCountImbalance =
    Math.max(pA1.matchCount, pA2.matchCount, pB1.matchCount, pB2.matchCount) -
    Math.min(pA1.matchCount, pA2.matchCount, pB1.matchCount, pB2.matchCount)

  // 3) Parcerias prévias
  const pastPairSum = getPartnerCount(pA1, pA2.id) + getPartnerCount(pB1, pB2.id)

  // 4) Preferências atendidas
  const preferredPairBonus =
    Number(prefSets[a1].has(pA2.id)) +
    Number(prefSets[a2].has(pA1.id)) +
    Number(prefSets[b1].has(pB2.id)) +
    Number(prefSets[b2].has(pB1.id))

  return (
    skillPairImbalance +
    WEIGHT.SKILL_IMBALANCE * teamImbalance +
    WEIGHT.MATCH_COUNT_IMBALANCE * matchCountImbalance +
    WEIGHT.MATCH_COUNT_TOTAL * playedSum +
    WEIGHT.PARTNER_COUNT * pastPairSum -
    WEIGHT.PREFERRED_PAIR * preferredPairBonus +
    WEIGHT.WITHIN_TEAM_VARIATION * withinTeamVariation
  )
}

/* ──────────────────────── Construção de partidas ─────────────────────────── */

/** Constrói todas as partidas possíveis (duas duplas disjuntas). O(n²·m) onde m≈n². */
function generateAllMatches(players: readonly Player[]): InternalMatch[] {
  const prefSets = buildPreferredSet(players)
  const pairs = generateIndexPairs(players.length)

  const matches: InternalMatch[] = []

  for (let i = 0; i < pairs.length; i++) {
    const [a1, a2] = pairs[i]

    // Evitar instanciar Set dentro do loop interno – interseção manual.
    for (let j = i + 1; j < pairs.length; j++) {
      const [b1, b2] = pairs[j]
      if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) {
        continue
      }

      const score = calculateMatchScore(players, prefSets, a1, a2, b1, b2)

      matches.push({ teamA: [a1, a2], teamB: [b1, b2], score })
    }
  }
  return matches
}

/* ─────────────────────────── Seleção final ───────────────────────────────── */

function selectTopMatches(matches: InternalMatch[], courts: number): InternalMatch[] {
  // Ordena por score crescente; usa random como tie‑break (estável).
  matches.sort((m1, m2) => {
    if (m1.score !== m2.score) return m1.score - m2.score
    return Math.random() - 0.5
  })

  const selected: InternalMatch[] = []
  const used = new Set<number>()

  for (const m of matches) {
    if (selected.length === courts) break

    const ids = [...m.teamA, ...m.teamB]
    if (ids.some((i) => used.has(i))) continue

    ids.forEach((i) => used.add(i))
    selected.push(m)
  }

  if (selected.length < courts) {
    throw new Error(`Não foi possível preencher todas as ${courts} quadras (apenas ${selected.length}).`)
  }

  return selected
}

/* ─────────────────────────── API pública ─────────────────────────────────── */

export function generateSchedule(players: readonly Player[], courts: number): UnsavedRound {
  if (players.length < MIN_PLAYERS) {
    throw new Error(`É preciso ao menos ${MIN_PLAYERS} jogadores para gerar o cronograma.`)
  }

  const allMatches = generateAllMatches(players)
  const best = selectTopMatches(allMatches, courts)

  return {
    id: crypto.randomUUID(),
    matches: best.map(({ teamA, teamB }) => ({
      id: crypto.randomUUID(),
      teamA: [players[teamA[0]], players[teamA[1]]],
      teamB: [players[teamB[0]], players[teamB[1]]],
      gamesA: null,
      gamesB: null,
      winner: null,
    })),
  }
}
