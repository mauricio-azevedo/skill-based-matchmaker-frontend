import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
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
  const { players, registerMatch } = usePlayers()

  /* ───────── rounds / seleção ───────── */
  const [state, dispatch] = useReducer(playTabReducer, {
    rounds: readAllCourtMatches(),
    selected: {},
    loading: {},
  } as State)

  /* ───────── linhas de quadras ───────── */
  const [rows, setRows] = useState(() => readAllCourts())

  /* ───────── sync nº de quadras ───────── */
  useEffect(() => {
    ensureCourtsTable(courts)
    purgeMatchesBeyond(courts)
    const fresh = readAllCourts()
    setRows(fresh)
    dispatch({ type: 'syncCourts', ids: fresh.map((r) => r.id) })
  }, [courts])

  /* ───────── jogadores indisponíveis ───────── */
  const unavailableIds = useMemo(() => {
    const s = new Set<string>()
    for (const courtRounds of Object.values(state.rounds)) {
      courtRounds.forEach((r) => {
        const m = r.matches[0]
        if (m.gamesA === null || m.gamesB === null) {
          ;[...m.teamA, ...m.teamB].forEach((p) => s.add(p.id))
        }
      })
    }
    return s
  }, [state.rounds])

  const availablePlayers = useMemo(() => players.filter((p) => !unavailableIds.has(p.id)), [players, unavailableIds])

  /* ───────── salvar placar + estatísticas ───────── */
  const handleSaveScore = useCallback(
    (courtId: CourtId, gamesA: number, gamesB: number) => {
      const idx = state.selected[courtId] ?? -1
      if (idx < 0) return

      const round = state.rounds[courtId]?.[idx]
      if (!round) return
      const match = round.matches[0]
      const firstTime = match.gamesA === null && match.gamesB === null

      dispatch({ type: 'updateScore', courtId, roundIdx: idx, gamesA, gamesB })
      updateMatchScore(courtId, idx, gamesA, gamesB)

      if (firstTime) registerMatch(match)
    },
    [state.rounds, state.selected, registerMatch],
  )

  /* ───────── gerar partida ───────── */
  const handleGenerate = useCallback(
    async (courtId: CourtId) => {
      if (availablePlayers.length < MIN_PLAYERS) {
        toast.error('Jogadores disponíveis insuficientes para gerar nova partida.')
        return
      }
      dispatch({ type: 'loading', courtId, value: true })
      try {
        const round = await generateSchedule(availablePlayers, formationMode)
        dispatch({ type: 'addRound', courtId, round })
        appendCourtMatch(courtId, round)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err))
      } finally {
        dispatch({ type: 'loading', courtId, value: false })
      }
    },
    [availablePlayers, formationMode],
  )

  /* ───────── outros handlers ───────── */
  const handleAddCourt = useCallback(() => setCourts((p) => p + 1), [setCourts])
  const handleSelect = useCallback(
    (id: CourtId, idx: number) => dispatch({ type: 'select', courtId: id, index: idx }),
    [],
  )

  /* ───────── helpers para UI ───────── */
  const courtFinished = (id: number) =>
    (state.rounds[id] ?? []).every((r) => r.matches[0].gamesA !== null && r.matches[0].gamesB !== null)

  return {
    rows,
    state,
    courtFinished,
    canGenerateGlobal: availablePlayers.length >= MIN_PLAYERS,
    handleAddCourt,
    handleGenerate,
    handleSelect,
    handleSaveScore,
  }
}
