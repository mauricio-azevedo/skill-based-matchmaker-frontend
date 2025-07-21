import type { Match, Player } from '@/types/entities'
import { FORMATION_MODES } from '@/lib/formationModes'

export type CreateMatchPayload = Omit<Match, 'id' | 'createdAt' | 'updatedAt' | 'shuffleHistory'>

export type FormationMode = (typeof FORMATION_MODES)[keyof typeof FORMATION_MODES]

export interface PlayerLBRow extends Player {
  P: number
  SV: number
  SG: number
  /** vitórias totais */
  W: number
  /** derrotas totais */
  L: number
  /** saldo de vitórias interno dentro do bloco empatado (undefined se não houver empate) */
  miniSV?: number
  /** saldo de games interno dentro do bloco empatado (undefined se não houver empate) */
  miniSG?: number
  /** games pró na mini-liga */
  GPmini?: number
  /** games contra na mini-liga */
  GCmini?: number
  /** vitórias na mini-liga */
  miniW?: number
  /** derrotas na mini-liga */
  miniL?: number
  /** nomes dos adversários no bloco ― útil para tooltip */
  oppMini?: string[]
}
