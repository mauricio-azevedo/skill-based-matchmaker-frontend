import type { Match, Player } from '@/types/entities'
import { FORMATION_MODES } from '@/lib/formationModes'
import type { FormationMode } from '@/types/types'
import { buildStats } from '@/lib/stats'

export const MIN_PLAYERS = 4 as const

/* ─────────────────── Pesos originais ─────────────────── */
const W = {
  MATCH_SUM: 100,
  MATCH_IMB: 100,
  SKILL_IMB: 80,
  WITHIN_VAR: 70,
  PARTNER: 50,
  PREF: 35,
} as const

/* ─────────────────── Helpers ─────────────────── */
type Pair = readonly [number, number]
const prefSets = (ps: readonly Player[]) => ps.map((p) => new Set(p.preferredPairs ?? []))
const comboKey = (a1: string, a2: string, b1: string, b2: string) =>
  [[a1, a2].sort().join('|'), [b1, b2].sort().join('|')].sort().join('#')

/* ─────────────────── Score ─────────────────── */
function score(
  pl: readonly Player[],
  pref: ReadonlyArray<Set<string>>,
  counts: Record<string, number>,
  partners: Record<string, Record<string, number>>,
  a1: number,
  a2: number,
  b1: number,
  b2: number,
  mode: FormationMode,
): number {
  const P = [pl[a1], pl[a2], pl[b1], pl[b2]] as const
  const getCnt = (id: string) => counts[id] || 0
  const getPart = (x: string, y: string) => partners[x]?.[y] ?? 0

  /* habilidade */
  const diff1 = Math.abs(P[0].level - P[2].level) + Math.abs(P[1].level - P[3].level)
  const diff2 = Math.abs(P[0].level - P[3].level) + Math.abs(P[1].level - P[2].level)
  const skillPair = Math.min(diff1, diff2)
  const teamImb = Math.abs(P[0].level + P[1].level - (P[2].level + P[3].level))
  const withinVar = Math.abs(P[0].level - P[1].level) + Math.abs(P[2].level - P[3].level)
  const withinW = mode === FORMATION_MODES.HOMOGENEOUS ? W.WITHIN_VAR : -W.WITHIN_VAR

  /* partidas */
  const cnts = P.map((p) => getCnt(p.id))
  const playedSum = cnts.reduce((s, n) => s + n, 0)
  const matchImb = Math.max(...cnts) - Math.min(...cnts)

  /* parceria + preferência */
  const pastPair = getPart(P[0].id, P[1].id) + getPart(P[2].id, P[3].id)
  const prefBonus =
    Number(pref[a1].has(P[1].id)) +
    Number(pref[a2].has(P[0].id)) +
    Number(pref[b1].has(P[3].id)) +
    Number(pref[b2].has(P[2].id))

  return (
    skillPair +
    W.SKILL_IMB * teamImb +
    W.MATCH_IMB * matchImb +
    W.MATCH_SUM * playedSum +
    W.PARTNER * pastPair -
    W.PREF * prefBonus +
    withinW * withinVar
  )
}

/* ─────────────────── API ─────────────────── */
export function generateMatch(
  players: readonly Player[],
  matches: readonly Match[],
  mode: FormationMode,
  excluded = new Set<string>(),
) {
  if (players.length < MIN_PLAYERS) throw new Error(`É preciso ao menos ${MIN_PLAYERS} jogadores.`)

  const { matchCounts, partnerCounts } = buildStats(matches as Match[])

  /* ----------- 1) filtrar pelo piso dinâmico ----------- */
  const freeCnts = players.map((p) => matchCounts[p.id] || 0)
  let threshold = Math.min(...freeCnts)
  while (players.filter((p) => (matchCounts[p.id] || 0) <= threshold).length < MIN_PLAYERS) {
    threshold++
  }

  const eligibleIdx = players
    .map((p, idx) => ({ idx, cnt: matchCounts[p.id] || 0 }))
    .filter((x) => x.cnt <= threshold)
    .map((x) => x.idx)

  /* ----------- 2) gerar partidas dentro do subconjunto ----------- */
  const pref = prefSets(players)
  const cand: { a: Pair; b: Pair; s: number }[] = []

  for (let i = 0; i < eligibleIdx.length - 1; i++) {
    for (let j = i + 1; j < eligibleIdx.length; j++) {
      const [a1, a2] = [eligibleIdx[i], eligibleIdx[j]]

      for (let k = 0; k < eligibleIdx.length - 1; k++) {
        for (let l = k + 1; l < eligibleIdx.length; l++) {
          const [b1, b2] = [eligibleIdx[k], eligibleIdx[l]]
          if (a1 === b1 || a1 === b2 || a2 === b1 || a2 === b2) continue

          const s = score(players, pref, matchCounts, partnerCounts, a1, a2, b1, b2, mode)
          cand.push({ a: [a1, a2], b: [b1, b2], s })
        }
      }
    }
  }

  if (!cand.length) throw new Error('Combinação elegível não encontrada.')

  cand.sort((x, y) => (x.s !== y.s ? x.s - y.s : Math.random() - 0.5))

  for (const c of cand) {
    const key = comboKey(players[c.a[0]].id, players[c.a[1]].id, players[c.b[0]].id, players[c.b[1]].id)
    if (!excluded.has(key)) {
      return {
        teamAPlayer1: players[c.a[0]].id,
        teamAPlayer2: players[c.a[1]].id,
        teamBPlayer1: players[c.b[0]].id,
        teamBPlayer2: players[c.b[1]].id,
      }
    }
  }
  throw new Error('Não há novas combinações disponíveis.')
}
