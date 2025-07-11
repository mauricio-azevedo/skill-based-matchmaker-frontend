import type { Reducer } from 'react'
import type { UnsavedRound } from '@/types/players'

/* ─────────── Types ─────────── */
export type CourtId = number
export type RoundsMap = Record<CourtId, UnsavedRound[]>
export type SelectedMap = Record<CourtId, number>
export type LoadingMap = Record<CourtId, boolean>

export interface State {
  rounds: RoundsMap
  selected: SelectedMap
  loading: LoadingMap
}

export type Action =
  | { type: 'addRound'; courtId: CourtId; round: UnsavedRound }
  | { type: 'select'; courtId: CourtId; index: number }
  | { type: 'syncCourts'; ids: CourtId[] }
  | { type: 'loading'; courtId: CourtId; value: boolean }

/* ─────────── Reducer ─────────── */
export const playTabReducer: Reducer<State, Action> = (state, action) => {
  switch (action.type) {
    case 'addRound': {
      const list = [...(state.rounds[action.courtId] ?? []), action.round]
      return {
        ...state,
        rounds: { ...state.rounds, [action.courtId]: list },
        selected: { ...state.selected, [action.courtId]: list.length - 1 },
        loading: { ...state.loading, [action.courtId]: false },
      }
    }
    case 'select':
      return {
        ...state,
        selected: { ...state.selected, [action.courtId]: action.index },
      }

    case 'loading':
      return {
        ...state,
        loading: { ...state.loading, [action.courtId]: action.value },
      }

    case 'syncCourts': {
      const rounds: RoundsMap = {}
      const selected: SelectedMap = {}
      const loading: LoadingMap = {}

      for (const id of action.ids) {
        const list = state.rounds[id] ?? []
        rounds[id] = list
        if (list.length) selected[id] = state.selected[id] ?? list.length - 1
        loading[id] = false
      }
      return { rounds, selected, loading }
    }
  }
}
