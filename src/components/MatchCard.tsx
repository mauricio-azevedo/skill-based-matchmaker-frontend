import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Crown } from 'lucide-react'
import type { Match } from '@/types/types'

/* Helpers ---------------------------------------------------------------- */
const SCORES = ['1', '2', '3', '4', '5', '6'] as const
const avatarUrl = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`

const PlayerEntry = ({ name, reverse = false }: { name: string; reverse?: boolean }) => (
  <div className={`flex items-center gap-2 ${reverse ? 'flex-row-reverse text-left' : 'text-right'}`}>
    <Avatar className="w-6 h-6 shrink-0">
      <AvatarImage src={avatarUrl(name)} alt={name} />
      <AvatarFallback>
        {name
          .split(' ')
          .slice(0, 2)
          .map((w) => w[0]?.toUpperCase())
          .join('')}
      </AvatarFallback>
    </Avatar>
    <p className="truncate max-w-[90px] text-sm">{name}</p>
  </div>
)

const ScoreSelect = ({
  value,
  onChange,
  label,
  isWinner,
}: {
  value: number | ''
  onChange: (v: number | '') => void
  label: string
  isWinner?: boolean
}) => (
  <div className="relative flex flex-col items-center">
    {isWinner && <Crown className="w-4 h-4 text-yellow-500 absolute -top-4" aria-label="Vencedor" />}

    <Select value={value === '' ? '' : String(value)} onValueChange={(v) => onChange(v === '' ? '' : +v)}>
      <SelectTrigger aria-label={label} className="w-10 h-10 justify-center text-center [&>svg]:hidden">
        <SelectValue placeholder="-" />
      </SelectTrigger>

      <SelectContent side="bottom">
        {SCORES.map((s) => (
          <SelectItem key={s} value={s} className="text-sm text-center">
            {s}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
)

/* MatchCard -------------------------------------------------------------- */
interface Props {
  match: Match | null
  onSave?: (gamesA: number, gamesB: number) => void
}

export function MatchCard({ match, onSave }: Props) {
  const [gamesA, setGamesA] = useState<number | ''>('')
  const [gamesB, setGamesB] = useState<number | ''>('')

  /* reseta ao trocar de partida */
  useEffect(() => {
    setGamesA(match?.gamesA ?? '')
    setGamesB(match?.gamesB ?? '')
  }, [match])

  const filled = gamesA !== '' && gamesB !== ''
  const dirty = match && ((match.gamesA ?? '') !== gamesA || (match.gamesB ?? '') !== gamesB)

  /* salva automaticamente */
  useEffect(() => {
    if (match && filled && dirty) onSave?.(+gamesA, +gamesB)
  }, [filled, dirty, gamesA, gamesB, match, onSave])

  if (!match) return <span className="text-muted-foreground text-sm">Nenhuma partida gerada.</span>

  const { teamA, teamB, winner } = match

  return (
    <div className="flex items-center justify-between gap-4">
      {/* Equipe A */}
      <div className="flex flex-col gap-2">
        <PlayerEntry name={teamA[0].name} />
        <PlayerEntry name={teamA[1].name} />
      </div>

      {/* Placar */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          <ScoreSelect value={gamesA} onChange={setGamesA} label="Games equipe A" isWinner={winner === 'A'} />
          <span className="text-muted-foreground">x</span>
          <ScoreSelect value={gamesB} onChange={setGamesB} label="Games equipe B" isWinner={winner === 'B'} />
        </div>
      </div>

      {/* Equipe B */}
      <div className="flex flex-col gap-2">
        <PlayerEntry name={teamB[0].name} reverse />
        <PlayerEntry name={teamB[1].name} reverse />
      </div>
    </div>
  )
}
