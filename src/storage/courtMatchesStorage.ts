import type { Match } from '@/types/players'

const COURT_MATCHES = 'court_matches'

export type CourtMatchRow = {
  courtId: number
  match: Match // A propriedade 'match' já é do tipo 'Match'
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
export function readAllCourtMatches(): Record<number, CourtMatchRow> {
  // Retorna o tipo correto
  const t = readTable()
  return t // Já retorna corretamente o dicionário com CourtMatchRow
}

export function appendCourtMatch(courtId: number, match: Match) {
  const t = readTable()
  t[courtId] = {
    courtId,
    match,
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

export function updateMatchScore(courtId: number, gamesA: number, gamesB: number) {
  const t = readTable()
  const court = t[courtId]
  if (!court) return

  const match = court.match
  match.gamesA = gamesA
  match.gamesB = gamesB
  match.winner = gamesA === gamesB ? null : gamesA > gamesB ? 'A' : 'B'

  t[courtId] = { ...court, match: { ...match }, updatedAt: new Date().toISOString() }
  saveTable(t)
}
