import { type FormationMode } from '@/types/types'

export const FORMATION_MODES = {
  HOMOGENEOUS: 'homogeneous',
  MIXED: 'mixed',
} as const

/**
 * Mapa de cada FormationMode para sua label em Português.
 */
export const FORMATION_MODE_LABELS: Record<FormationMode, string> = {
  [FORMATION_MODES.HOMOGENEOUS]: 'homogênea',
  [FORMATION_MODES.MIXED]: 'mista',
}

/**
 * Retorna a label legível de um FormationMode.
 */
export function translateFormationMode(mode: FormationMode): string {
  return FORMATION_MODE_LABELS[mode] ?? mode
}

/**
 * Dado um FormationMode, retorna o modo “oposto”:
 * homogêneo ↔ misto
 */
/**
 * Dado o modo de formação atual e a flag autoAlternate da quadra,
 * retorna a label do próximo modo (se autoAlternate=true) ou
 * a label do próprio modo (se false).
 */
export function getNextModeLabel(
  lastMatchMode: FormationMode | undefined,
  courtMode: FormationMode,
  autoAlternate: boolean,
): string {
  if (autoAlternate) {
    if (!lastMatchMode) return translateFormationMode(courtMode)

    const nextMode = lastMatchMode === FORMATION_MODES.HOMOGENEOUS ? FORMATION_MODES.MIXED : FORMATION_MODES.HOMOGENEOUS

    return translateFormationMode(nextMode)
  }

  return translateFormationMode(courtMode)
}
