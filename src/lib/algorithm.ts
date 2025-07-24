import type { Match, MatchPlayers, Player } from '@/types/entities'
import { type FormationMode, type MatchResult } from '@/types/types'
import { FORMATION_MODES } from '@/lib/formationModes'
import { shuffle } from '@/utils/shuffle'

/** Número mínimo de jogadores para formar duas duplas. */
export const MIN_PLAYERS = 4 as const

/** Pesos usados na função de pontuação. */
const WEIGHT = {
  SKILL_IMBALANCE: 20.1,
  WITHIN_TEAM_VARIATION: 20, // negativa no modo nivelado
  LAST_PLAYED: 6, // bônus proporcional ao tempo sem jogar
  PARTNER_COUNT: 2,
  PREFERRED_PAIR: 1,
} as const

/* ──────────────── Tipos ──────────────── */
type PlayerIdx = number
type DoublesPair = readonly [PlayerIdx, PlayerIdx]

export type PartnerCounts = Record<string, Record<string, number>>

interface ScoredMatch {
  teamA: DoublesPair
  teamB: DoublesPair
  score: number
}

/* ──────────────── Utilidades ──────────────── */

const indexPairs = (n: number): DoublesPair[] =>
  Array.from({ length: n }, (_, i) => Array.from({ length: n - i - 1 }, (_, j) => [i, i + j + 1] as DoublesPair)).flat()

const timesPartnered = (counts: PartnerCounts, a: string, b: string) => counts[a]?.[b] ?? 0
const preferredPairSets = (players: readonly Player[]) => players.map((p) => new Set(p.preferredPairs ?? []))

/** Distância (em partidas) desde a última vez que cada atleta jogou. */
function buildRecencyMap(matchHistory: readonly Match[], players: readonly Player[]): Record<string, number> {
  const now = matchHistory.length
  const distance: Record<string, number> = Object.fromEntries(players.map((p) => [p.id, now]))

  for (let i = matchHistory.length - 1; i >= 0; i--) {
    const m = matchHistory[i]
    const ids = [m.teamAPlayer1, m.teamAPlayer2, m.teamBPlayer1, m.teamBPlayer2]
    const dist = now - i - 1
    for (const id of ids) {
      if (distance[id] === now) distance[id] = dist
    }
    if (Object.values(distance).every((d) => d !== now)) break // todos encontrados
  }

  return distance
}

/* ──────────────── Pontuação ──────────────── */

function scoreMatch(
  players: readonly Player[],
  prefSets: ReadonlyArray<Set<string>>,
  recency: Record<string, number>,
  teamA: DoublesPair,
  teamB: DoublesPair,
  mode: FormationMode,
  partnerCounts: PartnerCounts,
): number {
  const [a1, a2] = teamA
  const [b1, b2] = teamB
  const [pA1, pA2, pB1, pB2] = [players[a1], players[a2], players[b1], players[b2]]

  /* — equilíbrio de nível — */
  const diffOpposite = Math.abs(pA1.level - pB1.level) + Math.abs(pA2.level - pB2.level)
  const diffDiagonal = Math.abs(pA1.level - pB2.level) + Math.abs(pA2.level - pB1.level)
  const skillPairImbalance = Math.min(diffOpposite, diffDiagonal)

  /* — variação interna das equipes — */
  const withinTeamVariation = Math.abs(pA1.level - pA2.level) + Math.abs(pB1.level - pB2.level)
  const withinVariationSign = mode === FORMATION_MODES.HOMOGENEOUS ? 1 : -1

  /* — penalidades e bônus — */
  const pastPairPenalty = timesPartnered(partnerCounts, pA1.id, pA2.id) + timesPartnered(partnerCounts, pB1.id, pB2.id)

  const preferredBonus =
    +prefSets[a1].has(pA2.id) + +prefSets[a2].has(pA1.id) + +prefSets[b1].has(pB2.id) + +prefSets[b2].has(pB1.id)

  /* — bônus por tempo sem jogar — */
  const recencyBonus = -(recency[pA1.id] + recency[pA2.id] + recency[pB1.id] + recency[pB2.id])

  return (
    WEIGHT.SKILL_IMBALANCE * skillPairImbalance +
    WEIGHT.WITHIN_TEAM_VARIATION * withinTeamVariation * withinVariationSign +
    WEIGHT.PARTNER_COUNT * pastPairPenalty -
    WEIGHT.PREFERRED_PAIR * preferredBonus +
    WEIGHT.LAST_PLAYED * recencyBonus
  )
}

/* ──────────────── Geração de partidas ──────────────── */

function enumerateMatches(
  players: readonly Player[],
  mode: FormationMode,
  partnerCounts: PartnerCounts,
  recency: Record<string, number>,
): ScoredMatch[] {
  const pairs = indexPairs(players.length)
  const prefSets = preferredPairSets(players)

  const matches: ScoredMatch[] = []

  for (let i = 0; i < pairs.length; i++) {
    for (let j = i + 1; j < pairs.length; j++) {
      const teamA = pairs[i]
      const teamB = pairs[j]
      if (new Set([...teamA, ...teamB]).size < 4) continue // sobreposição

      matches.push({
        teamA,
        teamB,
        score: scoreMatch(players, prefSets, recency, teamA, teamB, mode, partnerCounts),
      })
    }
  }

  return matches
}

/* —──── jogadores com menos referenceMatchCount —─── */

export function playersBelowMaxReferenceCount(players: readonly Player[]): string[] {
  if (players.length === 0) return []
  const maxCount = players.reduce((max, p) => (p.referenceMatchCount > max ? p.referenceMatchCount : max), 0)
  return players.filter((p) => p.referenceMatchCount < maxCount).map((p) => p.id)
}

export function filterMatchesForLowRefPlayers(
  matches: readonly ScoredMatch[],
  players: readonly Player[],
): ScoredMatch[] {
  const lowRefIds = playersBelowMaxReferenceCount(players)
  if (lowRefIds.length === 0) return matches as ScoredMatch[]

  const lowRefSet = new Set(lowRefIds)
  const requiredCount = Math.min(4, lowRefIds.length)

  return matches.filter((m) => {
    const ids = [players[m.teamA[0]].id, players[m.teamA[1]].id, players[m.teamB[0]].id, players[m.teamB[1]].id]
    const present = ids.reduce((sum, id) => sum + (lowRefSet.has(id) ? 1 : 0), 0)
    return present === requiredCount
  })
}

/** Retorna todas as partidas com a menor pontuação (melhor) entre as fornecidas. */
function getBestMatches(matches: readonly ScoredMatch[]): ScoredMatch[] {
  if (matches.length === 0) return []
  const bestScore = matches.reduce((min, m) => (m.score < min ? m.score : min), matches[0].score)
  return matches.filter((m) => m.score === bestScore)
}

function formatMatches(matches: readonly ScoredMatch[], players: readonly Player[]): MatchPlayers[] {
  return matches.map((m) => {
    const [x1, x2] = m.teamA
    const [y1, y2] = m.teamB

    return {
      teamAPlayer1: players[x1].id,
      teamAPlayer2: players[x2].id,
      teamBPlayer1: players[y1].id,
      teamBPlayer2: players[y2].id,
    }
  })
}

/* ──────────────── API pública ──────────────── */

/**
 * Gera a próxima partida, priorizando:
 *  • equilíbrio de nível,
 *  • variação interna (dependente do modo),
 *  • evitar parceiros repetidos,
 *  • atender pares preferidos,
 *  • e, agora, jogadores que estão há mais tempo sem jogar.
 *
 * @param AllPlayers         – lista completa de jogadores.
 * @param formationMode   – homogêneo ou nivelado.
 * @param partnerCounts   – histórico de parcerias (idA → idB → vezes).
 * @param matchHistory   – partidas já disputadas, ordem cronológica.
 */
export function generateMatch(
  AllPlayers: readonly Player[],
  formationMode: FormationMode,
  partnerCounts: PartnerCounts,
  matchHistory: readonly Match[],
): MatchResult {
  if (AllPlayers.length < MIN_PLAYERS) {
    throw new Error(`É preciso ao menos ${MIN_PLAYERS} jogadores para gerar o cronograma.`)
  }

  const recencyMap = buildRecencyMap(matchHistory, AllPlayers)

  const orderedMatches = enumerateMatches(AllPlayers, formationMode, partnerCounts, recencyMap).sort((a, b) =>
    a.score !== b.score ? a.score - b.score : Math.random() - 0.5,
  )

  const eligibleMatches = filterMatchesForLowRefPlayers(orderedMatches, AllPlayers)

  if (!eligibleMatches.length) throw new Error('Não há novas combinações disponíveis.')

  const bestMatches = getBestMatches(eligibleMatches)

  shuffle(bestMatches)

  const bestFormatted = formatMatches(bestMatches, AllPlayers)

  const [players, ...allAlternatives] = bestFormatted
  const alternatives = allAlternatives.slice(0, 3)

  return { players, alternatives }
}
