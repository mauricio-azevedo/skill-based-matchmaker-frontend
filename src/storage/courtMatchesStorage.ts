import type { UnsavedRound } from '@/types/players'

/** Chave única no localStorage */
export const COURT_MATCHES = 'court_matches'

/** Estrutura de cada registro persistido */
export type CourtMatchRow = {
  courtId: number
  round: UnsavedRound
  updatedAt: string
}

/* ─────────── helpers internos ─────────── */

function indexTable(): Record<number, CourtMatchRow> {
  try {
    return JSON.parse(localStorage.getItem(COURT_MATCHES) || '{}')
  } catch {
    return {}
  }
}

function saveTable(table: Record<number, CourtMatchRow>) {
  localStorage.setItem(COURT_MATCHES, JSON.stringify(table))
}

/* ─────────── API pública ─────────── */

/** Lê todas as partidas persistidas (courtId → UnsavedRound). */
export function readAllCourtMatches(): Record<number, UnsavedRound> {
  const table = indexTable()
  return Object.fromEntries(Object.values(table).map(({ courtId, round }) => [courtId, round]))
}

/** Salva (ou atualiza) a partida de uma quadra. */
export function upsertCourtMatch(courtId: number, round: UnsavedRound) {
  const table = indexTable()
  table[courtId] = { courtId, round, updatedAt: new Date().toISOString() }
  saveTable(table)
}

/** Remove partidas de quadras que deixaram de existir. */
export function purgeMatchesBeyond(maxCourtId: number) {
  const table = indexTable()
  let changed = false

  for (const key of Object.keys(table)) {
    const id = Number(key)
    if (id > maxCourtId) {
      delete table[id]
      changed = true
    }
  }

  if (changed) saveTable(table)
}
