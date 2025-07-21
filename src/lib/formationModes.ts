import { type FormationMode } from '@/types/types'

export const FORMATION_MODES = {
  HOMOGENEOUS: 'homogeneous',
  MIXED: 'mixed',
  MANUAL: 'manual',
} as const

/**
 * Mapa de cada FormationMode para sua label em Português.
 */
export const FORMATION_MODE_LABELS: Record<FormationMode, string> = {
  [FORMATION_MODES.HOMOGENEOUS]: 'nivelada',
  [FORMATION_MODES.MIXED]: 'mista',
  [FORMATION_MODES.MANUAL]: 'manual',
}

/**
 * Retorna a label legível de um FormationMode.
 */
export function translateFormationMode(mode: FormationMode): string {
  return FORMATION_MODE_LABELS[mode] ?? mode
}
