// ---------------------------------------------------------------------------
// Interface que representa um jogador único:
//   • id – UUID v4 para chave primária
//   • name – string livre informada pelo usuário
//   • level – inteiro >= 1 que representa habilidade; usado p/ balancear times
// ---------------------------------------------------------------------------
export interface Player {
  id: string
  name: string
  level: number // 1..N – maior = melhor
  active: boolean
  /** Quantas partidas já jogou */
  matchCount: number
  /** Histórico de parcerias: parceiroId → vezes jogadas juntos */
  partnerCounts: Record<string, number>
}

/** Cada partida contém dois times de dois jogadores. */
export interface Match {
  id: string
  teamA: Player[]
  teamB: Player[]
  gamesA: number | null
  gamesB: number | null
  winner: 'A' | 'B' | null
}

/** Conjunto de partidas que podem acontecer simultaneamente. */
export interface Round {
  matches: Match[] // ≤ courts partidas, sem jogadores repetidos
}

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
