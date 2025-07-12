import type { Reducer } from 'react'
import type { CourtMatchRow, Match } from '@/types/types'

export type CourtId = number
export type SelectedMap = Record<CourtId, boolean>
export type LoadingMap = Record<CourtId, boolean>

export interface State {
  matches: Record<CourtId, CourtMatchRow>
  selected: SelectedMap
  loading: LoadingMap
}

export type Action =
  | { type: 'addMatch'; courtId: CourtId; match: Match }
  | { type: 'select'; courtId: CourtId }
  | { type: 'updateScore'; courtId: CourtId; gamesA: number; gamesB: number }
  | { type: 'syncCourts'; ids: CourtId[] }
  | { type: 'loading'; courtId: CourtId; value: boolean }

export const playTabReducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case 'addMatch': {
      return {
        ...state,
        matches: {
          ...state.matches,
          [action.courtId]: {
            courtId: action.courtId, // Adicionando courtId
            match: action.match, // Adicionando match
            updatedAt: new Date().toISOString(), // Adicionando updatedAt
          },
        },
        selected: { ...state.selected, [action.courtId]: true },
        loading: { ...state.loading, [action.courtId]: false },
      }
    }

    case 'updateScore': {
      const court = state.matches[action.courtId]
      if (!court) return state

      // Atualizando o match no CourtMatchRow
      const match = court.match
      match.gamesA = action.gamesA
      match.gamesB = action.gamesB
      match.winner = action.gamesA === action.gamesB ? null : action.gamesA > action.gamesB ? 'A' : 'B'

      return {
        ...state,
        matches: {
          ...state.matches,
          [action.courtId]: {
            ...court,
            match: { ...match },
            updatedAt: new Date().toISOString(), // Atualizando o timestamp
          },
        },
      }
    }

    // Outras ações permanecem inalteradas
    case 'loading':
      return {
        ...state,
        loading: { ...state.loading, [action.courtId]: action.value },
      }

    case 'syncCourts': {
      const matches: Record<CourtId, CourtMatchRow> = {}
      const selected: SelectedMap = {}
      const loading: LoadingMap = {}

      for (const id of action.ids) {
        matches[id] = state.matches[id] ?? { courtId: id, match: {} as Match, updatedAt: '' }
        selected[id] = false
        loading[id] = false
      }
      return { matches, selected, loading }
    }

    default:
      return state
  }
}
