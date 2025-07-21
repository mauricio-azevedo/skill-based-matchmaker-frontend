'use client'

import { useMemo, useState } from 'react'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EditIcon } from 'lucide-react'
import { usePlayers } from '@/context/PlayersContext'
import { useMatches } from '@/context/MatchesContext'
import type { Match } from '@/types/entities'
import { cn } from '@/lib/utils'

interface Props {
  match: Match
}

export function EditMatchPlayersDialog({ match }: Props) {
  const { players } = usePlayers()
  const { matches, updateMatch } = useMatches()

  /** IDs of players already tied to another ongoing match (excluding this one) */
  const busyIds = useMemo(() => {
    const ids = new Set<string>()
    matches.forEach((m) => {
      if (m.status !== 'ongoing' || m.id === match.id) return
      ids.add(m.teamAPlayer1)
      ids.add(m.teamAPlayer2)
      ids.add(m.teamBPlayer1)
      ids.add(m.teamBPlayer2)
    })
    return ids
  }, [matches, match.id])

  /** Active + free players, plus the four players currently on this match */
  const options = useMemo(
    () =>
      players.filter(
        (p) =>
          p.active &&
          (!busyIds.has(p.id) ||
            [match.teamAPlayer1, match.teamAPlayer2, match.teamBPlayer1, match.teamBPlayer2].includes(p.id)),
      ),
    [players, busyIds, match],
  )

  const [a1, setA1] = useState(match.teamAPlayer1)
  const [a2, setA2] = useState(match.teamAPlayer2)
  const [b1, setB1] = useState(match.teamBPlayer1)
  const [b2, setB2] = useState(match.teamBPlayer2)

  const selections = [a1, a2, b1, b2]
  const duplicateIds = selections.filter((id, i) => selections.indexOf(id) !== i)
  const hasDuplicates = duplicateIds.length > 0
  const allChosen = selections.every(Boolean)
  const canSave = allChosen && !hasDuplicates

  const save = () => {
    updateMatch(match.id, {
      teamAPlayer1: a1,
      teamAPlayer2: a2,
      teamBPlayer1: b1,
      teamBPlayer2: b2,
    })
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="icon">
          <EditIcon />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar jogadores</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <PlayerSelect
            label="Equipe A – Jogador 1"
            value={a1}
            onChange={setA1}
            options={options}
            invalid={duplicateIds.includes(a1)}
          />

          <PlayerSelect
            label="Equipe B – Jogador 1"
            value={b1}
            onChange={setB1}
            options={options}
            invalid={duplicateIds.includes(b1)}
          />

          <PlayerSelect
            label="Equipe A – Jogador 2"
            value={a2}
            onChange={setA2}
            options={options}
            invalid={duplicateIds.includes(a2)}
          />

          <PlayerSelect
            label="Equipe B – Jogador 2"
            value={b2}
            onChange={setB2}
            options={options}
            invalid={duplicateIds.includes(b2)}
          />
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" className="mr-2">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" disabled={!canSave} onClick={save}>
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface PlayerSelectProps {
  label: string
  value: string
  onChange: (v: string) => void
  options: { id: string; name: string }[]
  invalid?: boolean
}

const PlayerSelect = ({ label, value, onChange, options, invalid }: PlayerSelectProps) => (
  <Select value={value} onValueChange={onChange}>
    <SelectTrigger
      className={cn('w-full', invalid && 'border-destructive focus:ring-destructive focus:border-destructive')}
    >
      <SelectValue placeholder={label} />
    </SelectTrigger>
    <SelectContent>
      {options.map((p) => (
        <SelectItem key={p.id} value={p.id}>
          {p.name}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)
