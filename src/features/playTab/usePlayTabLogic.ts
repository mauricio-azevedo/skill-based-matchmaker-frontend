import { useCourts } from '@/context/CourtsContext'
import { usePlayers } from '@/context/PlayersContext'
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import {
  appendCourtMatch,
  purgeMatchesBeyond,
  readAllCourtMatches,
  updateMatchScore,
} from '@/storage/courtMatchesStorage'
import { type CourtId, playTabReducer, type State } from '@/features/playTab/playTabReducer'
import { ensureCourtsTable, readAllCourts } from '@/storage/courtsStorage'
import { generateSchedule, MIN_PLAYERS } from '@/lib/algorithm'
import { toast } from 'sonner'

export function usePlayTabLogic() {
  const { courts, setCourts, formationMode } = useCourts()
  const { players } = usePlayers()

  const [state, dispatch] = useReducer(playTabReducer, {
    courtMatches: readAllCourtMatches(),
    selected: {},
    loading: {},
  } as State)

  const [rows, setRows] = useState(() => readAllCourts())

  useEffect(() => {
    ensureCourtsTable(courts)
    purgeMatchesBeyond(courts)

    const freshRows = readAllCourts()
    setRows(freshRows)
    dispatch({ type: 'syncCourts', ids: freshRows.map((r) => r.id) })
  }, [courts])

  const unavailableIds = useMemo(() => {
    const s = new Set<string>()
    Object.values(state.courtMatches).forEach((courtMatchRow) => {
      const match = courtMatchRow?.match
      if (match && (match.gamesA == null || match.gamesB == null)) {
        // Check if teamA and teamB are arrays before iterating
        if (Array.isArray(match.teamA)) {
          match.teamA.forEach((p) => s.add(p.id))
        }
        if (Array.isArray(match.teamB)) {
          match.teamB.forEach((p) => s.add(p.id))
        }
      }
    })
    return s
  }, [state.courtMatches])

  const availablePlayers = useMemo(
    () => players.filter((p) => p.active && !unavailableIds.has(p.id)),
    [players, unavailableIds],
  )

  const handleSaveScore = useCallback(
    (courtId: CourtId, gamesA: number, gamesB: number) => {
      const courtMatchRow = state.courtMatches[courtId]
      if (!courtMatchRow) return

      dispatch({ type: 'updateScore', courtId, gamesA, gamesB })
      updateMatchScore(courtId, gamesA, gamesB)
    },
    [state.courtMatches],
  )

  const handleGenerate = useCallback(
    async (courtId: CourtId) => {
      if (availablePlayers.length < MIN_PLAYERS) {
        toast.error('Jogadores ativos disponíveis insuficientes.')
        return
      }

      dispatch({ type: 'loading', courtId, value: true })

      try {
        const match = await generateSchedule(availablePlayers, formationMode)
        if (!match) {
          toast.error('Erro ao gerar partida')
          return
        }
        dispatch({ type: 'addMatch', courtId, match })
        appendCourtMatch(courtId, match)
      } catch (err) {
        toast.error(err instanceof Error ? err.message : String(err))
      } finally {
        dispatch({ type: 'loading', courtId, value: false })
      }
    },
    [availablePlayers, formationMode],
  )

  const handleAddCourt = useCallback(() => setCourts((p) => p + 1), [setCourts])

  const courtFinished = (id: number) => {
    const match = state.courtMatches[id]?.match
    console.log(`Quadra ${id} - match: `, match) // Log da propriedade match

    // Verifica se o match está presente e foi finalizado
    return match?.gamesA != null && match?.gamesB != null
  }

  // Verificando o valor de canGenerateGlobal
  const canGenerateGlobal = availablePlayers.length >= MIN_PLAYERS
  console.log('canGenerateGlobal:', canGenerateGlobal)

  return {
    rows,
    state,
    courtFinished,
    canGenerateGlobal,
    handleAddCourt,
    handleGenerate,
    handleSaveScore,
  }
}
