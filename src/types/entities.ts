import type { FormationMode } from '@/types/types'

export interface Player {
  id: string // Unique identifier for the player
  name: string // Name of the player
  level: number // Level of the player (higher = better)
  active: boolean // Whether the player is currently active
  matchCount: number // How many matches the player has played
  partnerCounts: Record<string, number> // How many times the player has played with each partner (partnerId → times played together)
  preferredPairs: string[] // List of player IDs that the player prefers to pair with
  createdAt: string // Timestamp of when the player was created
  updatedAt: string // Timestamp of when the player was last updated
}

export interface Match {
  id: string // Unique identifier for the match
  courtId: string // The ID of the court where the match is happening
  teamAPlayer1: string // Player ID for Team A Player 1
  teamAPlayer2: string // Player ID for Team A Player 2
  teamBPlayer1: string // Player ID for Team B Player 1
  teamBPlayer2: string // Player ID for Team B Player 2
  startTime: string // Start time of the match in ISO format
  endTime: string | null // Optionally, the end time of the match (if it has ended)
  status: 'ongoing' | 'completed' // Status of the match
  gamesA: number | null // Number of games won by Team A, or null if match is ongoing
  gamesB: number | null // Number of games won by Team B, or null if match is ongoing
  winner: 'A' | 'B' | null // The winner of the match ('A', 'B', or null if ongoing)
  formationMode: FormationMode // The formation mode ('homogeneous' or 'mixed')
  createdAt: string // Timestamp of when the match was created
  updatedAt: string // Timestamp of when the match was last updated
}

export interface Court {
  id: string // Identificador único da quadra
  matchId: string | null // ID da partida atribuída (ongoing ou completed)
  formationMode: FormationMode // Modo de formação desta quadra
  autoAlternate: boolean // Alterna automaticamente para esta quadra?
  createdAt: string // Timestamp de criação
  updatedAt: string // Timestamp de última atualização
}
