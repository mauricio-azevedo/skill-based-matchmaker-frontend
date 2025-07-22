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

/* ------------------------------------------------------------------------ */
interface Props {
  match: Match
  matchNumber: number
}

export function EditMatchPlayersDialog({ match, matchNumber }: Props) {
  const { players } = usePlayers()
  const { matches, updateMatch } = useMatches()

  const [open, setOpen] = useState(false)

  /** IDs já ocupados em outras partidas (exceto esta) */
  const busyIds: Set<string> = useMemo(() => getBusyPlayerIds(matches, [match.id]), [matches, match.id])

  /** Jogadores ativos e livres + os quatro já nesta partida */
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

  /** Recarrega seleções quando o diálogo abre */
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
          <EditIcon className="!w-4.5 !h-4.5" />
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar partida {matchNumber}</DialogTitle>
        </DialogHeader>

        {/* ---------- layout: 3‑col grid (1fr‑auto‑1fr) ---------- */}
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2">
          {/* Equipe A */}
          <div className="flex flex-col gap-2 min-w-0">
            <PlayerSelect value={a1} onChange={setA1} options={options} invalid={duplicateIds.includes(a1)} />
            <PlayerSelect value={a2} onChange={setA2} options={options} invalid={duplicateIds.includes(a2)} />
          </div>

          {/* Separador */}
          <XIcon className="text-muted-foreground w-4 h-4" />

          {/* Equipe B */}
          <div className="flex flex-col gap-2 min-w-0">
            <PlayerSelect value={b1} onChange={setB1} options={options} invalid={duplicateIds.includes(b1)} />
            <PlayerSelect value={b2} onChange={setB2} options={options} invalid={duplicateIds.includes(b2)} />
          </div>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-2">
          <DialogClose asChild>
            <Button type="button" variant="outline" size="lg" className="h-11 text-md">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="button" disabled={!canSave} onClick={save} size="lg" className="h-11 text-md">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/* ------------------------------------------------------------------------ */
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
      <SelectTrigger
        className={cn(
          // full‑width flex row: left=content (can shrink), right=caret (fixed)
          'w-full min-w-0 flex items-center justify-between gap-2 !ring-0 !border-border !h-11 text-md p-2',
          invalid && '!ring-2 !ring-destructive',
        )}
      >
        {/* content takes all free space and can truncate */}
        <div className="min-w-0 flex-1">{selected && <PlayerEntry name={selected.name} className="min-w-0" />}</div>
        {/* the caret icon is rendered by shadcn internally – no change needed */}
      </SelectTrigger>

      <SelectContent>
        {options.map((p) => (
          <SelectItem key={p.id} value={p.id} className="h-11 text-md">
            <PlayerEntry name={p.name} matchCount={p.matchCount} />
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
