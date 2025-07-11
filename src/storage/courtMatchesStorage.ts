import type { UnsavedRound } from '@/types/players'

const COURT_MATCHES = 'court_matches'

export type CourtMatchRow = {
  courtId: number
  rounds: UnsavedRound[]
  updatedAt: string
}

/* helpers */
function readTable(): Record<number, CourtMatchRow> {
  try {
    return JSON.parse(localStorage.getItem(COURT_MATCHES) || '{}')
  } catch {
    return {}
  }
}
function saveTable(t: Record<number, CourtMatchRow>) {
  localStorage.setItem(COURT_MATCHES, JSON.stringify(t))
}

/* API */
export function readAllCourtMatches(): Record<number, UnsavedRound[]> {
  const t = readTable()
  return Object.fromEntries(Object.values(t).map(({ courtId, rounds }) => [courtId, rounds]))
}

export function appendCourtMatch(courtId: number, round: UnsavedRound) {
  const t = readTable()
  const list = t[courtId]?.rounds ?? []
  t[courtId] = {
    courtId,
    rounds: [...list, round],
    updatedAt: new Date().toISOString(),
  }
  saveTable(t)
}

export function purgeMatchesBeyond(maxId: number) {
  const table = readTable()
  let changed = false

  for (const key of Object.keys(table)) {
    const id = Number(key)

    if (id > maxId) {
      delete table[id]
      changed = true
    }
  }

  if (changed) saveTable(table)
}

export function updateMatchScore(courtId: number, roundIdx: number, gamesA: number, gamesB: number) {
  const t = readTable()
  const rounds = t[courtId]?.rounds ?? []
  const round = rounds[roundIdx]
  if (!round) return

  const match = round.matches[0]
  match.gamesA = gamesA
  match.gamesB = gamesB
  match.winner = gamesA === gamesB ? null : gamesA > gamesB ? 'A' : 'B'

  rounds[roundIdx] = { ...round, matches: [{ ...match }] }
  t[courtId] = { ...t[courtId], rounds, updatedAt: new Date().toISOString() }
  saveTable(t)
}
