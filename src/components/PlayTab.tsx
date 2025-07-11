import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'

import { useCourts } from '@/context/CourtsContext'
import { usePlayers } from '@/context/PlayersContext'

import { type CourtRow, ensureCourtsTable, readAllCourts } from '@/storage/courtsStorage'
import { purgeMatchesBeyond, readAllCourtMatches, upsertCourtMatch } from '@/storage/courtMatchesStorage'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import type { UnsavedRound } from '@/types/players'
import { generateSchedule } from '@/lib/algorithm'
import { MatchCard } from '@/components/MatchCard'

export function PlayTab() {
  /* ─────────────────────────── estado/contexto ────────────────────────── */
  const { courts, setCourts, formationMode } = useCourts()
  const { players } = usePlayers()

  const [rows, setRows] = useState<CourtRow[]>(() => readAllCourts())
  const [schedules, setSchedules] = useState<Record<number, UnsavedRound>>(() => readAllCourtMatches())

  /* Sincroniza a “tabela” de quadras e as partidas persistidas */
  useEffect(() => {
    ensureCourtsTable(courts)
    purgeMatchesBeyond(courts) // remove partidas de quadras inexistentes
    setRows(readAllCourts())
    setSchedules(readAllCourtMatches()) // recarrega partidas válidas
  }, [courts])

  /* Adiciona nova quadra */
  const handleAddCourt = () => setCourts((prev) => prev + 1)

  /* Gera partida para uma quadra específica */
  const handleGenerate = (courtId: number) => {
    try {
      const schedule = generateSchedule(players, formationMode)
      setSchedules((prev) => ({ ...prev, [courtId]: schedule }))
      upsertCourtMatch(courtId, schedule) // persiste no localStorage
    } catch (err) {
      toast.error(String(err))
    }
  }

  /* ─────────────────────────── render ────────────────────────── */
  return (
    <div className="flex flex-col gap-4">
      {/* Barra de ações */}
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2" onClick={handleAddCourt}>
          <Plus size={16} />
          Adicionar quadra
        </Button>
      </div>

      {/* Lista de quadras persistidas */}
      {rows.map(({ id }) => {
        const schedule = schedules[id]
        const match = schedule?.matches[0]

        return (
          <Card key={id} aria-label={`Quadra ${id}`}>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Quadra {id}</CardTitle>

              {/* Botão para gerar/atualizar partida */}
              <Button size="sm" onClick={() => handleGenerate(id)}>
                {schedule ? 'Regerar partida' : 'Gerar partida'}
              </Button>
            </CardHeader>

            <CardContent>
              <MatchCard match={match} />
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
