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
  winner: 'A' | 'B' | null
}

/** Conjunto de partidas que podem acontecer simultaneamente. */
export interface Round {
  matches: Match[] // ≤ courts partidas, sem jogadores repetidos
}
