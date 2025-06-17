// src/consts/levels.ts
// ---------------------------------------------------------------------------
// Tabela ‘valor numérico → label visual’ usada em toda a aplicação.
// ---------------------------------------------------------------------------

export const LEVELS = [
  { value: 1, label: 'C' },
  { value: 2, label: 'B' },
  { value: 3, label: 'BB' },
  { value: 4, label: 'A' },
  { value: 5, label: 'AA' },
] as const // ⬅️ ‘as const’ preserva tipos literais

// Helper genérico: devolve label ou fallback
export function getLevelLabel(level: number): string {
  return LEVELS.find((l) => l.value === level)?.label ?? `N${level}`
}
