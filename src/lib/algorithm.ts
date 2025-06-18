// src/lib/algorithm.ts

import type { Player, UnsavedRound } from '@/types/players'
import { shuffle } from '@/utils/shuffle'

// mínimo de jogadores necessários para uma rodada
const MIN_PLAYERS = 4 as const

// constantes de peso para o cálculo de score
const WEIGHT = {
  SKILL_IMBALANCE: 8, // α: evita times com diferença grande de habilidade
  MATCH_COUNT_TOTAL: 10, // β: prioriza partidas com jogadores que, em média, jogaram menos até agora
  MATCH_COUNT_IMBALANCE: 0, // δ: evita partidas com desequilíbrio (ex: alguém com 4 jogos e outro com 0)
  PARTNER_COUNT: 10, // γ: evita repetir duplas que já jogaram juntas antes
  WITHIN_TEAM_VARIATION: 1, // ε: evita variação interna de nível dentro do mesmo time
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
function calculateMatchScore(a1: Player, a2: Player, b1: Player, b2: Player): number {
  // diferença de skill individual
  const diff1 = Math.abs(a1.level - b1.level) + Math.abs(a2.level - b2.level)
  const diff2 = Math.abs(a1.level - b2.level) + Math.abs(a2.level - b1.level)
  const skillPairImbalance = Math.min(diff1, diff2)

  // diferença de skill total dos times
  const teamImbalance = Math.abs(a1.level + a2.level - (b1.level + b2.level))

  // variação de nível dentro de cada time
  const withinTeamVariation = Math.abs(a1.level - a2.level) + Math.abs(b1.level - b2.level)

  // média de partidas que cada um já jogou
  const playedSum = a1.matchCount + a2.matchCount + b1.matchCount + b2.matchCount

  // diferença entre a quantidade de partidas que cada um já jogou
  const matchCountImbalance =
    Math.max(a1.matchCount, a2.matchCount, b1.matchCount, b2.matchCount) -
      Math.min(a1.matchCount, a2.matchCount, b1.matchCount, b2.matchCount) || 1

  // quantas vezes já foram parceiros
  const pastPairSum = (a1.partnerCounts[a2.id] || 0) + (b1.partnerCounts[b2.id] || 0)

  return (
    skillPairImbalance +
    WEIGHT.SKILL_IMBALANCE * teamImbalance +
    WEIGHT.MATCH_COUNT_IMBALANCE * matchCountImbalance +
    WEIGHT.MATCH_COUNT_TOTAL * playedSum +
    WEIGHT.PARTNER_COUNT * pastPairSum +
    WEIGHT.WITHIN_TEAM_VARIATION * withinTeamVariation
  )
}

/**
 * Constrói todas as partidas possíveis (dois pares distintos).
 */
function generateAllMatches(pairs: [Player, Player][]): InternalMatch[] {
  const matches: InternalMatch[] = []
  for (let i = 0; i < pairs.length; i++) {
    const [a1, a2] = pairs[i]
    for (let j = i + 1; j < pairs.length; j++) {
      const [b1, b2] = pairs[j]
      if (new Set([a1.id, a2.id]).has(b1.id) || new Set([a1.id, a2.id]).has(b2.id)) continue
      const score = calculateMatchScore(a1, a2, b1, b2)
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
export function generateSchedule(players: Player[], courts: number): UnsavedRound {
  if (players.length < MIN_PLAYERS) {
    throw new Error(`É preciso ao menos ${MIN_PLAYERS} jogadores para gerar o cronograma.`)
  }

  const pairs = generatePairs(players)
  const allMatches = generateAllMatches(pairs)

  shuffle(allMatches)
  allMatches.sort((m1, m2) => m1.score - m2.score)

  const best = selectTopMatches(allMatches, courts)

  return {
    id: crypto.randomUUID(),
    matches: best.map(({ teamA, teamB }) => ({
      id: crypto.randomUUID(),
      teamA,
      teamB,
      gamesA: null,
      gamesB: null,
      winner: null,
    })),
  }
}
