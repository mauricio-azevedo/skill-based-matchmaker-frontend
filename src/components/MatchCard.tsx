import { forwardRef, useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Crown, XIcon } from 'lucide-react'
import { usePlayers } from '@/context/PlayersContext'
import { useMatches } from '@/context/MatchesContext'
import type { Match } from '@/types/entities'

/* Helpers ---------------------------------------------------------------- */
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

interface ScoreSelectProps {
  value: number | ''
  onChange: (v: number | '') => void
  label: string
  isWinner?: boolean
}

const ScoreSelect = forwardRef<HTMLInputElement, ScoreSelectProps>(({ value, onChange, label, isWinner }, ref) => (
  <div className="relative flex flex-col items-center">
    {isWinner && <Crown className="w-4 h-4 text-yellow-500 absolute -top-4" aria-label="Vencedor" />}
    <Input
      ref={ref}
      type="number"
      inputMode="numeric"
      pattern="[0-9]*"
      aria-label={label}
      value={value === '' ? '' : value}
      onChange={(e) => {
        const val = e.currentTarget.value
        onChange(val === '' ? '' : Number(val))
      }}
      className="w-10 h-10 text-center p-0"
      placeholder="-"
    />
  </div>
))
ScoreSelect.displayName = 'ScoreSelect'

export function MatchCard({ match }: { match: Match }) {
  const [gamesA, setGamesA] = useState<number | ''>('')
  const [gamesB, setGamesB] = useState<number | ''>('')

  const { getById } = usePlayers()
  const { updateMatch } = useMatches()

  const inputARef = useRef<HTMLInputElement>(null)
  const inputBRef = useRef<HTMLInputElement>(null)

  // 1) Reseta os estados de games A/B SOMENTE quando mudar de partida
  useEffect(() => {
    setGamesA(match.gamesA ?? '')
    setGamesB(match.gamesB ?? '')
  }, [match.id])

  const filled = gamesA !== '' && gamesB !== ''
  const dirty = (match.gamesA ?? '') !== gamesA || (match.gamesB ?? '') !== gamesB

  // 2) Auto‐save: só dispara quando o usuário muda gamesA ou gamesB
  useEffect(() => {
    if (
      !match ||
      !filled || // precisa ter os dois scores
      !dirty || // e ser diferente do contexto
      gamesA === gamesB // e não pode empatar
    ) {
      return
    }

    const winnerValue = gamesA > gamesB ? 'A' : 'B'
    const now = new Date().toISOString()

    updateMatch(match.id, {
      gamesA: gamesA as number,
      gamesB: gamesB as number,
      winner: winnerValue,
      status: 'completed',
      endTime: now,
    })
  }, [gamesA, gamesB, filled, dirty, match.id, updateMatch])

  // 3) Se digitar em A e B ainda vazio, foca B, e vice‑versa
  const handleChangeA = (v: number | '') => {
    setGamesA(v)
    if (v !== '' && gamesB === '') {
      inputBRef.current?.focus()
    }
  }
  const handleChangeB = (v: number | '') => {
    setGamesB(v)
    if (v !== '' && gamesA === '') {
      inputARef.current?.focus()
    }
  }

  const { teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2, winner } = match
  const playerA1 = getById(teamAPlayer1)
  const playerA2 = getById(teamAPlayer2)
  const playerB1 = getById(teamBPlayer1)
  const playerB2 = getById(teamBPlayer2)

  return (
    <div className="flex items-center justify-between gap-1">
      {/* Equipe A */}
      <div className="flex flex-col gap-2 flex-1">
        {playerA1 && <PlayerEntry name={playerA1.name} />}
        {playerA2 && <PlayerEntry name={playerA2.name} />}
      </div>

      {/* Placar */}
      <div className="flex flex-col items-center gap-1">
        <div className="flex items-center gap-1">
          <ScoreSelect
            ref={inputARef}
            value={gamesA}
            onChange={handleChangeA}
            label="Games equipe A"
            isWinner={winner === 'A'}
          />
          <XIcon className="text-muted-foreground w-4 h-4" />
          <ScoreSelect
            ref={inputBRef}
            value={gamesB}
            onChange={handleChangeB}
            label="Games equipe B"
            isWinner={winner === 'B'}
          />
        </div>
      </div>

      {/* Equipe B */}
      <div className="flex flex-col gap-2 flex-1">
        {playerB1 && <PlayerEntry name={playerB1.name} reverse />}
        {playerB2 && <PlayerEntry name={playerB2.name} reverse />}
      </div>
    </div>
  )
}
