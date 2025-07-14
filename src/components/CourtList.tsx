import { useState } from 'react'
import { useCourts } from '@/context/CourtsContext'
import { useMatches } from '@/context/MatchesContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { type CourtOption, RemoveCourtsDialog } from './RemoveCourtsDialog'
import { usePlayers } from '@/context/PlayersContext'
import type { Player } from '@/types/types'

export function CourtList() {
  const { courts, setCourts, removeCourtsAndMatches, courtsEntities } = useCourts()
  const { matches } = useMatches()
  const { getById } = usePlayers()

  const ongoingMatches = matches.filter((m) => m.status === 'ongoing')
  const ongoingCount = ongoingMatches.length

  const [dialogOpen, setDialogOpen] = useState(false)
  const [desiredCount, setDesiredCount] = useState<number>(courts)

  const options: CourtOption[] = courtsEntities
    .filter((c) => c.matchId && ongoingMatches.some((m) => m.id === c.matchId))
    .map((c, idx) => {
      const m = ongoingMatches.find((m) => m.id === c.matchId)!
      const a1: Player | null = getById(m.teamAPlayer1)
      const a2: Player | null = getById(m.teamAPlayer2)
      const b1: Player | null = getById(m.teamBPlayer1)
      const b2: Player | null = getById(m.teamBPlayer2)

      if (!a1 || !a2 || !b1 || !b2) {
        throw new Error('Jogadores ausentes')
      }

      return {
        id: c.id,
        label: `Quadra ${idx + 1}`,
        teamAPlayer1: a1.name,
        teamAPlayer2: a2.name,
        teamBPlayer1: b1.name,
        teamBPlayer2: b2.name,
      }
    })

  const handleValueChange = (value: string) => {
    const newCount = Number(value)
    if (newCount < ongoingCount) {
      setDesiredCount(newCount)
      setDialogOpen(true)
    } else {
      setCourts(newCount)
    }
  }

  const handleConfirm = (selectedCourtIds: string[]) => {
    removeCourtsAndMatches(selectedCourtIds, desiredCount)
    setDialogOpen(false)
  }

  const handleCancel = () => {
    setDialogOpen(false)
  }

  return (
    <>
      <div className="flex justify-between items-center mb-2">
        <Label className="flex-col items-start">
          <span>Quadras</span>
          <span className="text-xs text-muted-foreground font-normal">Quantidade de quadras disponíveis.</span>
        </Label>
        <Select value={courts.toString()} onValueChange={handleValueChange}>
          <SelectTrigger className="w-[80px]">
            <SelectValue placeholder="Selecione" />
          </SelectTrigger>
          <SelectContent>
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <SelectItem key={num} value={num.toString()}>
                {num}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <RemoveCourtsDialog
        open={dialogOpen}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
        options={options}
        toRemoveCount={ongoingCount - desiredCount}
      />
    </>
  )
}
