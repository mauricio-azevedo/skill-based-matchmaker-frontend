import { forwardRef, useEffect, useRef, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Crown, XIcon } from 'lucide-react'
import { usePlayers } from '@/context/PlayersContext'
import { useMatches } from '@/context/MatchesContext'
import type { Match } from '@/types/entities'
import { PlayerEntry } from '@/components/PlayerEntry'

/* ---------- score selector ---------- */
interface ScoreSelectProps {
  value: number | ''
  onChange: (v: number | '') => void
  label: string
  isWinner?: boolean
}

const ScoreSelect = forwardRef<HTMLInputElement, ScoreSelectProps>(({ value, onChange, label, isWinner }, ref) => (
  <div className="relative flex flex-col items-center">
    {isWinner && <Crown className="!w-4.5 !h-4.5 text-yellow-500 absolute -top-4" aria-label="Vencedor" />}
    <Input
      ref={ref}
      type="text"
      inputMode="numeric"
      maxLength={1}
      aria-label={label}
      value={value === '' ? '' : value}
      onChange={(e) => {
        const v = e.currentTarget.value
        onChange(v === '' ? '' : Number(v))
      }}
      onFocus={(e) => e.currentTarget.select()}
      onMouseUp={(e) => e.preventDefault()}
      className="w-11 h-11 text-center p-0"
    />
  </div>
))

ScoreSelect.displayName = 'ScoreSelect'

/* ---------- match card ---------- */
export function MatchCard({ match }: { match: Match }) {
  const [gamesA, setGamesA] = useState<number | ''>('')
  const [gamesB, setGamesB] = useState<number | ''>('')

  const { getById } = usePlayers()
  const { updateMatch } = useMatches()

  const inputARef = useRef<HTMLInputElement>(null)
  const inputBRef = useRef<HTMLInputElement>(null)

  /* 1) reset local state when the match changes */
  useEffect(() => {
    setGamesA(match.gamesA ?? '')
    setGamesB(match.gamesB ?? '')
  }, [match.id])

  const filled = gamesA !== '' && gamesB !== ''
  const dirty = (match.gamesA ?? '') !== gamesA || (match.gamesB ?? '') !== gamesB

  /* 2) autosave once both scores are filled and different */
  useEffect(() => {
    if (!filled || !dirty || gamesA === gamesB) return

    const winnerValue = gamesA > gamesB ? 'A' : 'B'
    updateMatch(match.id, {
      gamesA: gamesA as number,
      gamesB: gamesB as number,
      winner: winnerValue,
      status: 'completed',
      endTime: new Date().toISOString(),
    })
  }, [gamesA, gamesB, filled, dirty, match.id, updateMatch])

  /* 3–4) focus/blur logic & no ties */
  const handleChangeA = (v: number | '') => {
    if (v !== '' && v === gamesB) return
    setGamesA(v)
    if (v !== '' && gamesB === '') inputBRef.current?.focus()
    else if (v !== '' && gamesB !== '') inputARef.current?.blur()
  }

  const handleChangeB = (v: number | '') => {
    if (v !== '' && v === gamesA) return
    setGamesB(v)
    if (v !== '' && gamesA === '') inputARef.current?.focus()
    else if (v !== '' && gamesA !== '') inputBRef.current?.blur()
  }

  /* players */
  const { teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2, winner } = match
  const playerA1 = getById(teamAPlayer1)
  const playerA2 = getById(teamAPlayer2)
  const playerB1 = getById(teamBPlayer1)
  const playerB2 = getById(teamBPlayer2)

  /* ---------- layout ---------- */
  return (
    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 w-full">
      {/* team A (shrinks if names are long) */}
      <div className="flex flex-col gap-2 min-w-0">
        {playerA1 && <PlayerEntry name={playerA1.name} />}
        {playerA2 && <PlayerEntry name={playerA2.name} />}
      </div>

      {/* score — strictly centred column */}
      <div className="flex items-center justify-center gap-2">
        <ScoreSelect
          ref={inputARef}
          value={gamesA}
          onChange={handleChangeA}
          label="Games equipe A"
          isWinner={winner === 'A'}
        />
        <XIcon className="text-muted-foreground !w-4.5 !h-4.5" />
        <ScoreSelect
          ref={inputBRef}
          value={gamesB}
          onChange={handleChangeB}
          label="Games equipe B"
          isWinner={winner === 'B'}
        />
      </div>

      {/* team B */}
      <div className="flex flex-col gap-2 min-w-0">
        {playerB1 && <PlayerEntry name={playerB1.name} reverse />}
        {playerB2 && <PlayerEntry name={playerB2.name} reverse />}
      </div>
    </div>
  )
}
