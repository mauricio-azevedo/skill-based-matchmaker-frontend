import { useCallback, useEffect, useReducer, useState } from 'react'
import { type CourtId, playTabReducer, type State } from './playTabReducer'

import { generateSchedule, MIN_PLAYERS } from '@/lib/algorithm'
import { useCourts } from '@/context/CourtsContext'
import { usePlayers } from '@/context/PlayersContext'

import { ensureCourtsTable, readAllCourts } from '@/storage/courtsStorage'
import {
  appendCourtMatch,
  purgeMatchesBeyond,
  readAllCourtMatches,
  updateMatchScore,
} from '@/storage/courtMatchesStorage'

import { toast } from 'sonner'

export function usePlayTabLogic() {
  /* ───────── contexto ───────── */
  const { courts, setCourts, formationMode } = useCourts()
  const { players } = usePlayers()

  /* ───────── estado via reducer ───────── */
  const initialState: State = {
    rounds: readAllCourtMatches(),
    selected: {},
    loading: {},
  }

  const [state, dispatch] = useReducer(playTabReducer, initialState)

  /* ───────── linhas de quadras para render ───────── */
  const [rows, setRows] = useState(() => readAllCourts())

  /* ───────── sincronizar quando nº de quadras muda ───────── */
  useEffect(() => {
    ensureCourtsTable(courts)
    purgeMatchesBeyond(courts)

    const fresh = readAllCourts()
    setRows(fresh)
    dispatch({ type: 'syncCourts', ids: fresh.map((r) => r.id) })
  }, [courts])

  /* salvar placar */
  const handleSaveScore = useCallback(
    (courtId: CourtId, gamesA: number, gamesB: number) => {
      const roundIdx = state.selected[courtId] ?? -1
      if (roundIdx < 0) return

      dispatch({ type: 'updateScore', courtId, roundIdx, gamesA, gamesB })
      updateMatchScore(courtId, roundIdx, gamesA, gamesB)
    },
    [state.selected],
  )

  /* ───────── handlers ───────── */
  const handleAddCourt = useCallback(() => setCourts((p) => p + 1), [setCourts])

  const handleGenerate = useCallback(
    async (courtId: CourtId) => {
      dispatch({ type: 'loading', courtId, value: true })

      try {
        const round = await generateSchedule(players, formationMode)
        dispatch({ type: 'addRound', courtId, round })
        appendCourtMatch(courtId, round)
      } catch (err) {
        dispatch({ type: 'loading', courtId, value: false })
        toast.error(err instanceof Error ? err.message : String(err))
      }
    },
    [players, formationMode],
  )

  const handleSelect = useCallback(
    (courtId: CourtId, idx: number) => dispatch({ type: 'select', courtId, index: idx }),
    [],
  )

  /* ───────── retorno ───────── */
  return {
    rows,
    state,
    canGenerate: players.length >= MIN_PLAYERS,
    handleAddCourt,
    handleGenerate,
    handleSelect,
    handleSaveScore,
  }
}
