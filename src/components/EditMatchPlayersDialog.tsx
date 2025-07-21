import { useEffect, useMemo, useState } from 'react'
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
import type { Match, Player } from '@/types/entities'
import { cn } from '@/lib/utils'
import { getBusyPlayerIds } from '@/lib/matchUtils'
import { PlayerEntry } from '@/components/PlayerEntry'

/* Dialog ----------------------------------------------------------------- */
interface Props {
  match: Match
}

export function EditMatchPlayersDialog({ match }: Props) {
  const { players } = usePlayers()
  const { matches, updateMatch } = useMatches()

  const [open, setOpen] = useState(false)

  /** IDs of players already tied to another ongoing match (excluding this one) */
  const busyIds: Set<string> = useMemo(() => getBusyPlayerIds(matches, [match.id]), [matches, match.id])

  /** Active + free players, plus the four players currently on this match */
  const options: Player[] = useMemo(
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

  /** Whenever the dialog opens, discard any unsaved edits and reload from `match` */
  useEffect(() => {
    if (!open) return

    setA1(match.teamAPlayer1)
    setA2(match.teamAPlayer2)
    setB1(match.teamBPlayer1)
    setB2(match.teamBPlayer2)
  }, [open, match])

  const selections = [a1, a2, b1, b2]
  const duplicateIds = selections.filter((id, i) => selections.indexOf(id) !== i)
  const allChosen = selections.every(Boolean)
  const canSave = allChosen && duplicateIds.length === 0

  const save = () => {
    updateMatch(match.id, {
      teamAPlayer1: a1,
      teamAPlayer2: a2,
      teamBPlayer1: b1,
      teamBPlayer2: b2,
    })

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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

const PlayerSelect = ({ label, value, onChange, options, invalid }: PlayerSelectProps) => {
  const selected = options.find((p) => p.id === value)

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={cn('w-full', invalid && 'border-destructive focus:ring-destructive focus:border-destructive')}
      >
        {selected ? <PlayerEntry name={selected.name} /> : <SelectValue placeholder={label} />}
      </SelectTrigger>

      <SelectContent>
        {options.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <PlayerEntry name={p.name} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
