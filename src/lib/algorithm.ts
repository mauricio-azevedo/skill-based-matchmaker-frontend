// src/lib/algorithm.ts

import type { Player, Round } from '../types/players'

// mínimo de jogadores necessários para uma rodada
const MIN_PLAYERS = 4 as const

// constantes de peso para o cálculo de score
const WEIGHT = {
  SKILL_IMBALANCE: 2, // α: peso para diferença de habilidade total do time
  MATCH_COUNT: 1, // β: peso para quantidade de partidas já jogadas
  PARTNER_COUNT: 1, // γ: peso para frequência de parceria passada
}

/**
 * Embaralha um array in-place (Fisher–Yates).
 */
function shuffle<T>(array: T[]): void {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[array[i], array[j]] = [array[j], array[i]]
  }
}

/**
 * Gera todos os pares únicos de jogadores.
 */
function generatePairs(players: Player[]): [Player, Player][] {
  const pairs: [Player, Player][] = []
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      pairs.push([players[i], players[j]])
    }
  }
  return pairs
}

type InternalMatch = {
  teamA: [Player, Player]
  teamB: [Player, Player]
  score: number
}

/**
 * Calcula o "score" de balanceamento para dois pares formarem uma partida.
 * Quanto menor o score, mais balanceada a partida.
 */
function calculateMatchScore(
  a1: Player,
  a2: Player,
  b1: Player,
  b2: Player,
  matchCounts: Map<string, number>,
  partnerCounts: Map<string, Map<string, number>>,
): number {
  // 1) diferença de skill individual (α)
  const diff1 = Math.abs(a1.level - b1.level) + Math.abs(a2.level - b2.level)
  const diff2 = Math.abs(a1.level - b2.level) + Math.abs(a2.level - b1.level)
  const skillPairImbalance = Math.min(diff1, diff2)

  // 2) diferença de skill total do time (α)
  const teamTotalA = a1.level + a2.level
  const teamTotalB = b1.level + b2.level
  const teamImbalance = Math.abs(teamTotalA - teamTotalB)

  // 3) quantas partidas já jogadas por todos (β)
  const playedSum =
    (matchCounts.get(a1.id) || 0) +
    (matchCounts.get(a2.id) || 0) +
    (matchCounts.get(b1.id) || 0) +
    (matchCounts.get(b2.id) || 0)

  // 4) quantas vezes esses pares já jogaram juntos (γ)
  const pastA = partnerCounts.get(a1.id)?.get(a2.id) || 0
  const pastB = partnerCounts.get(b1.id)?.get(b2.id) || 0
  const pastPairSum = pastA + pastB

  // pontuação final (menor = melhor)
  return (
    skillPairImbalance +
    WEIGHT.SKILL_IMBALANCE * teamImbalance +
    WEIGHT.MATCH_COUNT * playedSum +
    WEIGHT.PARTNER_COUNT * pastPairSum
  )
}

/**
 * Constrói todas as partidas possíveis (dois pares distintos).
 */
function generateAllMatches(
  pairs: [Player, Player][],
  matchCounts: Map<string, number>,
  partnerCounts: Map<string, Map<string, number>>,
): InternalMatch[] {
  const matches: InternalMatch[] = []

  for (let i = 0; i < pairs.length; i++) {
    const [a1, a2] = pairs[i]
    for (let j = i + 1; j < pairs.length; j++) {
      const [b1, b2] = pairs[j]

      // pula se repetir jogador
      const idsA = new Set([a1.id, a2.id])
      if (idsA.has(b1.id) || idsA.has(b2.id)) continue

      const score = calculateMatchScore(a1, a2, b1, b2, matchCounts, partnerCounts)
      matches.push({ teamA: [a1, a2], teamB: [b1, b2], score })
    }
  }

  return matches
}

/**
 * Seleciona as melhores partidas até o número de quadras, garantindo
 * que nenhum jogador seja usado em mais de uma partida nesta rodada.
 */
function selectTopMatches(matches: InternalMatch[], courts: number): InternalMatch[] {
  const selected: InternalMatch[] = []
  const usedIds = new Set<string>()

  for (const match of matches) {
    if (selected.length >= courts) break

    const ids = [...match.teamA, ...match.teamB].map((p) => p.id)
    if (ids.some((id) => usedIds.has(id))) continue

    ids.forEach((id) => usedIds.add(id))
    selected.push(match)
  }

  return selected
}

/**
 * Gera um Round com partidas balanceadas.
 */
export function generateSchedule(
  players: Player[],
  courts: number,
  matchCounts: Map<string, number>,
  partnerCounts: Map<string, Map<string, number>>,
): Round {
  if (players.length < MIN_PLAYERS) {
    throw new Error(`É preciso ao menos ${MIN_PLAYERS} jogadores para gerar o cronograma.`)
  }

  // 1) combina pares e gera todas as possibilidades
  const pairs = generatePairs(players)
  const allMatches = generateAllMatches(pairs, matchCounts, partnerCounts)

  // 2) embaralha para desempatar scores iguais
  shuffle(allMatches)

  // 3) ordena por score ascendente (mais balanceadas primeiro)
  allMatches.sort((m1, m2) => m1.score - m2.score)

  // 4) seleciona as melhores sem reusar jogadores
  const best = selectTopMatches(allMatches, courts)

  // retorna apenas a estrutura externa esperada
  return {
    matches: best.map(({ teamA, teamB }) => ({ teamA, teamB })),
  }
}
