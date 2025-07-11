export const COURTS_TABLE = 'courts_table'

export type CourtRow = {
  id: number // PK
  createdAt: string // metadata
  updatedAt: string
}

/** Retorna todos os registros, já ordenados por id */
export function readAllCourts(): CourtRow[] {
  const raw = localStorage.getItem(COURTS_TABLE)
  if (!raw) return []
  return Object.values(JSON.parse(raw) as Record<number, CourtRow>).sort((a: CourtRow, b: CourtRow) => a.id - b.id)
}

/** Upsert de um registro (insere ou atualiza) */
export function upsertCourt(row: CourtRow) {
  const table = indexTable()
  table[row.id] = { ...row, updatedAt: new Date().toISOString() }
  localStorage.setItem(COURTS_TABLE, JSON.stringify(table))
}

/** Garante que existam exatamente `courts` linhas (1…courts) */
export function ensureCourtsTable(courts: number) {
  const table = indexTable()
  let changed = false

  // cria os que faltam
  for (let id = 1; id <= courts; id++) {
    if (!table[id]) {
      table[id] = {
        id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      changed = true
    }
  }

  // elimina sobras
  for (const key of Object.keys(table)) {
    const id = Number(key)
    if (id > courts) {
      delete table[id]
      changed = true
    }
  }

  if (changed) localStorage.setItem(COURTS_TABLE, JSON.stringify(table))
}

/** Lê a “tabela” como dicionário id → row */
function indexTable(): Record<number, CourtRow> {
  try {
    return JSON.parse(localStorage.getItem(COURTS_TABLE) || '{}')
  } catch {
    return {}
  }
}
