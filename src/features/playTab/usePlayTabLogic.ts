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
  /* contexto */
  const { courts, setCourts, formationMode } = useCourts()
  const { players, registerMatch } = usePlayers()

  /* estado local (rounds + seleção) */
  const [state, dispatch] = useReducer(playTabReducer, {
    rounds: readAllCourtMatches(),
    selected: {},
    loading: {},
  } as State)

  /* linhas da tabela de quadras */
  const [rows, setRows] = useState(() => readAllCourts())

  /* sincroniza quando nº de quadras muda */
  useEffect(() => {
    ensureCourtsTable(courts)
    purgeMatchesBeyond(courts)
    const fresh = readAllCourts()
    setRows(fresh)
    dispatch({ type: 'syncCourts', ids: fresh.map((r) => r.id) })
  }, [courts])

  /* salvar placar + estatísticas */
  const handleSaveScore = useCallback(
    (courtId: CourtId, gamesA: number, gamesB: number) => {
      const roundIdx = state.selected[courtId] ?? -1
      if (roundIdx < 0) return

      const prevRound = state.rounds[courtId]?.[roundIdx]
      if (!prevRound) return
      const prevMatch = prevRound.matches[0]
      const firstTime = prevMatch.gamesA === null && prevMatch.gamesB === null

      /* atualiza reducer + storage */
      dispatch({ type: 'updateScore', courtId, roundIdx, gamesA, gamesB })
      updateMatchScore(courtId, roundIdx, gamesA, gamesB)

      /* estatísticas */
      if (firstTime) registerMatch(prevMatch)
    },
    [state.rounds, state.selected, registerMatch],
  )

  /* gerar partida */
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

  /* outros handlers */
  const handleAddCourt = useCallback(() => setCourts((p) => p + 1), [setCourts])
  const handleSelect = useCallback(
    (courtId: CourtId, idx: number) => dispatch({ type: 'select', courtId, index: idx }),
    [],
  )

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
