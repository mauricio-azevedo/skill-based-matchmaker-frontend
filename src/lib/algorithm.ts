import type { Player } from '@/types/entities'
import { type FormationMode } from '@/types/types'
import { FORMATION_MODES } from '@/lib/formationModes'

/** Número mínimo de jogadores para formar duas duplas. */
export const MIN_PLAYERS = 4 as const

/** Pesos usados na função de pontuação. */
const WEIGHT = {
  LAST_PLAYED: 10, // bônus proporcional ao tempo sem jogar
  SKILL_IMBALANCE: 8,
  WITHIN_TEAM_VARIATION: 3, // vira -3 no modo nivelado
  PARTNER_COUNT: 2,
  PREFERRED_PAIR: 1,
} as const

/* ──────────────── Tipos ──────────────── */
type PlayerIdx = number
type DoublesPair = readonly [PlayerIdx, PlayerIdx]

export type PartnerCounts = Record<string, Record<string, number>>

/** Histórico cronológico de partidas já realizadas (mais antigas → primeiro). */
export interface PlayedMatch {
  teamA: readonly [string, string]
  teamB: readonly [string, string]
}

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

/** Chave única para impedir combinações repetidas, independente da ordem. */
const comboKey = (...ids: [string, string, string, string]) =>
  [[ids[0], ids[1]].sort().join('|'), [ids[2], ids[3]].sort().join('|')].sort().join('#')

/** Distância (em partidas) desde a última vez que cada atleta jogou. */
function buildRecencyMap(history: readonly PlayedMatch[], players: readonly Player[]): Record<string, number> {
  const now = history.length
  const distance: Record<string, number> = Object.fromEntries(players.map((p) => [p.id, now]))

  for (let i = history.length - 1; i >= 0; i--) {
    const ids = [...history[i].teamA, ...history[i].teamB]
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
  const withinWeight =
    mode === FORMATION_MODES.HOMOGENEOUS ? WEIGHT.WITHIN_TEAM_VARIATION : -WEIGHT.WITHIN_TEAM_VARIATION

  /* — penalidades e bônus — */
  const pastPairPenalty = timesPartnered(partnerCounts, pA1.id, pA2.id) + timesPartnered(partnerCounts, pB1.id, pB2.id)

  const preferredBonus =
    +prefSets[a1].has(pA2.id) + +prefSets[a2].has(pA1.id) + +prefSets[b1].has(pB2.id) + +prefSets[b2].has(pB1.id)

  /* — bônus por tempo sem jogar — */
  const recencyBonus = -(recency[pA1.id] + recency[pA2.id] + recency[pB1.id] + recency[pB2.id])

  return (
    WEIGHT.SKILL_IMBALANCE * skillPairImbalance +
    withinWeight * withinTeamVariation +
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

function selectNextMatch(
  matches: ScoredMatch[],
  players: readonly Player[],
  excluded: Set<string>,
): ScoredMatch | undefined {
  for (const match of matches) {
    const key = comboKey(
      players[match.teamA[0]].id,
      players[match.teamA[1]].id,
      players[match.teamB[0]].id,
      players[match.teamB[1]].id,
    )
    if (!excluded.has(key)) return match
  }
  return undefined
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

/* ──────────────── API pública ──────────────── */

/**
 * Gera a próxima partida, priorizando:
 *  • equilíbrio de nível,
 *  • variação interna (dependente do modo),
 *  • evitar parceiros repetidos,
 *  • atender pares preferidos,
 *  • e, agora, jogadores que estão há mais tempo sem jogar.
 *
 * @param players         – lista completa de jogadores.
 * @param formationMode   – homogêneo ou nivelado.
 * @param partnerCounts   – histórico de parcerias (idA → idB → vezes).
 * @param playedHistory   – partidas já disputadas, ordem cronológica.
 * @param excludedCombos  – combinações a descartar.
 */
export function generateMatch(
  players: readonly Player[],
  formationMode: FormationMode,
  partnerCounts: PartnerCounts,
  playedHistory: readonly PlayedMatch[] = [],
  excludedCombos: Set<string> = new Set(),
): {
  teamAPlayer1: string
  teamAPlayer2: string
  teamBPlayer1: string
  teamBPlayer2: string
} {
  if (players.length < MIN_PLAYERS) {
    throw new Error(`É preciso ao menos ${MIN_PLAYERS} jogadores para gerar o cronograma.`)
  }

  /* — cálculo de distância desde a última partida de cada atleta — */
  const recencyMap = buildRecencyMap(playedHistory, players)

  /* — pontuação e ordenação — */
  const orderedMatches = enumerateMatches(players, formationMode, partnerCounts, recencyMap).sort((a, b) =>
    a.score !== b.score ? a.score - b.score : Math.random() - 0.5,
  )

  const eligibleMatches = filterMatchesForLowRefPlayers(orderedMatches, players)

  const chosen = selectNextMatch(eligibleMatches, players, excludedCombos)
  if (!chosen) throw new Error('Não há novas combinações disponíveis.')

  const [a1, a2] = chosen.teamA
  const [b1, b2] = chosen.teamB

  return {
    teamAPlayer1: players[a1].id,
    teamAPlayer2: players[a2].id,
    teamBPlayer1: players[b1].id,
    teamBPlayer2: players[b2].id,
  }
}
