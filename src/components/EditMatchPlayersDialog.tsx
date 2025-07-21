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
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { EditIcon, XIcon } from 'lucide-react'
import { usePlayers } from '@/context/PlayersContext'
import { useMatches } from '@/context/MatchesContext'
import type { Match, Player } from '@/types/entities'
import { cn } from '@/lib/utils'
import { getBusyPlayerIds } from '@/lib/matchUtils'
import { PlayerEntry } from '@/components/PlayerEntry'
import { FORMATION_MODES } from '@/lib/formationModes'

/* Dialog ----------------------------------------------------------------- */
interface Props {
  match: Match
  matchNumber: number
}

export function EditMatchPlayersDialog({ match, matchNumber }: Props) {
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
      formationMode: FORMATION_MODES.MANUAL,
    })

    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-11 h-11">
          <EditIcon />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar partida {matchNumber}</DialogTitle>
        </DialogHeader>
        <div className="flex gap-2 items-center justify-between py-2">
          <div className="flex flex-col gap-2 flex-1">
            <PlayerSelect value={a1} onChange={setA1} options={options} invalid={duplicateIds.includes(a1)} />
            <PlayerSelect value={a2} onChange={setA2} options={options} invalid={duplicateIds.includes(a2)} />
          </div>
          <XIcon className="text-muted-foreground w-4 h-4" />
          <div className="flex flex-col gap-2 flex-1">
            <PlayerSelect value={b1} onChange={setB1} options={options} invalid={duplicateIds.includes(b1)} />
            <PlayerSelect value={b2} onChange={setB2} options={options} invalid={duplicateIds.includes(b2)} />
          </div>
        </div>
        <DialogFooter className="flex flex-row justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline">
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
  value: string
  onChange: (v: string) => void
  options: Player[]
  invalid?: boolean
}

const PlayerSelect = ({ value, onChange, options, invalid }: PlayerSelectProps) => {
  const selected = options.find((p) => p.id === value)

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={cn('w-full !ring-0 !border-border', invalid && '!ring-2 !ring-destructive')}>
        {selected ? <PlayerEntry name={selected.name} /> : null}
      </SelectTrigger>

      <SelectContent>
        {options.map((p) => (
          <SelectItem key={p.id} value={p.id}>
            <PlayerEntry name={p.name} matchCount={p.matchCount} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
