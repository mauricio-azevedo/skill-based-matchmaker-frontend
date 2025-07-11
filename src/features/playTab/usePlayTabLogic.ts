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

/**
 * Encapsula toda a lógica da aba “Play”.
 * Feita para telas mobile, mas totalmente independente de UI.
 */
export function usePlayTabLogic() {
  /* ───────── contexto global ───────── */
  const { courts, setCourts, formationMode } = useCourts()
  const { players, registerMatch } = usePlayers()

  /* ───────── estado local (rounds / seleção) ───────── */
  const [state, dispatch] = useReducer(playTabReducer, {
    rounds: readAllCourtMatches(),
    selected: {},
    loading: {},
  } as State)

  /* ───────── rows da tabela de quadras (1..courts) ───────── */
  const [rows, setRows] = useState(() => readAllCourts())

  /* sincroniza quando o # de quadras muda */
  useEffect(() => {
    ensureCourtsTable(courts)
    purgeMatchesBeyond(courts)

    const fresh = readAllCourts()
    setRows(fresh)
    dispatch({ type: 'syncCourts', ids: fresh.map((r) => r.id) })
  }, [courts])

  /* ───────── jogadores indisponíveis (partida em andamento) ───────── */
  const unavailableIds = useMemo(() => {
    const s = new Set<string>()
    Object.values(state.rounds).forEach((courtRounds) =>
      courtRounds.forEach((r) => {
        const m = r.matches[0]
        if (m.gamesA == null || m.gamesB == null) {
          ;[...m.teamA, ...m.teamB].forEach((p) => s.add(p.id))
        }
      }),
    )
    return s
  }, [state.rounds])

  /* ───────── jogadores elegíveis p/ gerar partida ─────────
     • ativos (`active === true`)
     • não presos em partidas em aberto                       */
  const availablePlayers = useMemo(
    () => players.filter((p) => p.active && !unavailableIds.has(p.id)),
    [players, unavailableIds],
  )

  /* ───────── salvar placar + atualizar estatísticas ───────── */
  const handleSaveScore = useCallback(
    (courtId: CourtId, gamesA: number, gamesB: number) => {
      const idx = state.selected[courtId] ?? -1
      if (idx < 0) return

      const round = state.rounds[courtId]?.[idx]
      if (!round) return
      const match = round.matches[0]

      const firstTime = match.gamesA == null && match.gamesB == null

      /* atualiza store local + localStorage */
      dispatch({ type: 'updateScore', courtId, roundIdx: idx, gamesA, gamesB })
      updateMatchScore(courtId, idx, gamesA, gamesB)

      /* registra estatísticas globais apenas na 1ª vez */
      if (firstTime) registerMatch(match)
    },
    [state.rounds, state.selected, registerMatch],
  )

  /* ───────── gerar nova partida ───────── */
  const handleGenerate = useCallback(
    async (courtId: CourtId) => {
      if (availablePlayers.length < MIN_PLAYERS) {
        toast.error('Jogadores ativos disponíveis insuficientes.')
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

  /* ───────── helper p/ habilitar botão “Gerar partida” ───────── */
  const courtFinished = (id: number) =>
    (state.rounds[id] ?? []).every((r) => r.matches[0].gamesA != null && r.matches[0].gamesB != null)

  return {
    /* dados p/ UI */
    rows,
    state,
    courtFinished,
    canGenerateGlobal: availablePlayers.length >= MIN_PLAYERS,

    /* callbacks p/ UI */
    handleAddCourt,
    handleGenerate,
    handleSelect,
    handleSaveScore,
  }
}
