import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Match } from '@/types/players'

/* ------------------------------------------------------------------------
 * Utils
 * --------------------------------------------------------------------- */
const SCORE_OPTIONS = [...Array(6)].map((_, i) => String(i + 1)) // ['1','2',..,'6']

const avatarUrl = (name: string) => `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`

/* jogador + avatar (reutilizável) ------------------------------------- */
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
    <p className="truncate max-w-[90px]">{name}</p>
  </div>
)

/* select 1-6 ----------------------------------------------------------- */
const ScoreSelect = ({
  value,
  onChange,
  label,
}: {
  value: number | ''
  onChange: (v: number | '') => void
  label: string
}) => (
  <Select value={value === '' ? '' : String(value)} onValueChange={(v) => onChange(v === '' ? '' : +v)}>
    <SelectTrigger aria-label={label} className="w-10 h-10 justify-center text-center [&>svg]:hidden">
      <SelectValue placeholder="-" />
    </SelectTrigger>

    <SelectContent side="bottom">
      {SCORE_OPTIONS.map((opt) => (
        <SelectItem key={opt} value={opt} className="text-sm text-center">
          {opt}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
)

/* ------------------------------------------------------------------------
 * MatchCard
 * --------------------------------------------------------------------- */
interface Props {
  match?: Match
  /** dispara automaticamente assim que ambos os placares válidos forem definidos */
  onSave?: (gamesA: number, gamesB: number) => void
}

export function MatchCard({ match, onSave }: Props) {
  /* placares locais */
  const [gamesA, setGamesA] = useState<number | ''>('')
  const [gamesB, setGamesB] = useState<number | ''>('')

  /* reseta quando muda a partida */
  useEffect(() => {
    setGamesA(match?.gamesA ?? '')
    setGamesB(match?.gamesB ?? '')
  }, [match])

  const bothFilled = gamesA !== '' && gamesB !== ''
  const dirty = match && ((match.gamesA ?? '') !== gamesA || (match.gamesB ?? '') !== gamesB)

  /* salva automaticamente */
  useEffect(() => {
    if (match && bothFilled && dirty) onSave?.(+gamesA, +gamesB)
  }, [bothFilled, dirty, gamesA, gamesB, match, onSave])

  /* fallback */
  if (!match) return <span className="text-muted-foreground text-sm">Nenhuma partida gerada.</span>

  const { teamA, teamB } = match

  return (
    <div className="flex items-center justify-between gap-4">
      {/* equipe A */}
      <div className="flex flex-col gap-2">
        <PlayerEntry name={teamA[0].name} />
        <PlayerEntry name={teamA[1].name} />
      </div>

      {/* seletor central */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          <ScoreSelect value={gamesA} onChange={setGamesA} label="Games equipe A" />
          <span className="text-muted-foreground">x</span>
          <ScoreSelect value={gamesB} onChange={setGamesB} label="Games equipe B" />
        </div>

        {match.winner && (
          <span className="text-xs italic text-muted-foreground">
            {match.winner === 'A' ? 'Vitória A' : 'Vitória B'}
          </span>
        )}
      </div>

      {/* equipe B (espelhada) */}
      <div className="flex flex-col gap-2">
        <PlayerEntry name={teamB[0].name} reverse />
        <PlayerEntry name={teamB[1].name} reverse />
      </div>
    </div>
  )
}
