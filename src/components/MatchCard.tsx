import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import type { Match } from '@/types/players'

interface Props {
  match?: Match
  /** callback disparado automaticamente quando ambos os placares forem preenchidos */
  onSave?: (gamesA: number, gamesB: number) => void
}

/**
 * Cartão de partida (mobile-first) – sem botão “Salvar”.
 * Assim que os dois campos recebem valores válidos, `onSave` é disparado
 * automaticamente (apenas se o placar mudou).
 */
export function MatchCard({ match, onSave }: Props) {
  /* estado local */
  const [a, setA] = useState<number | ''>('')
  const [b, setB] = useState<number | ''>('')

  /* reseta placares ao trocar de partida */
  useEffect(() => {
    setA(match?.gamesA ?? '')
    setB(match?.gamesB ?? '')
  }, [match])

  const bothFilled = a !== '' && b !== ''
  const dirty = match !== undefined && ((match.gamesA ?? '') !== a || (match.gamesB ?? '') !== b)

  /* dispara callback assim que ambos os campos estiverem preenchidos e houve mudança */
  useEffect(() => {
    if (match && bothFilled && dirty) {
      onSave?.(+a, +b)
    }
  }, [bothFilled, dirty, a, b, match, onSave])

  /* placeholder – nenhuma partida */
  if (!match) return <span className="text-muted-foreground text-sm">Nenhuma partida gerada.</span>

  return (
    <div className="flex flex-col gap-3">
      {/* jogadores */}
      <div className="flex flex-col text-center text-sm leading-tight">
        <span className="font-medium break-words">
          {match.teamA[0].name} & {match.teamA[1].name}
        </span>
        <span className="text-xs text-muted-foreground">vs.</span>
        <span className="font-medium break-words">
          {match.teamB[0].name} & {match.teamB[1].name}
        </span>
      </div>

      {/* inputs do placar */}
      <div className="flex items-center justify-center gap-2">
        <Input
          type="number"
          min={0}
          value={a}
          onChange={(e) => setA(e.target.value === '' ? '' : +e.target.value)}
          className="w-14 text-center"
          inputMode="numeric"
          pattern="[0-9]*"
        />
        <span className="text-muted-foreground">x</span>
        <Input
          type="number"
          min={0}
          value={b}
          onChange={(e) => setB(e.target.value === '' ? '' : +e.target.value)}
          className="w-14 text-center"
          inputMode="numeric"
          pattern="[0-9]*"
        />
      </div>

      {/* vencedor */}
      {match.winner && (
        <span className="text-xs italic text-muted-foreground text-center">
          Vencedor: {match.winner === 'A' ? 'Equipe A' : 'Equipe B'}
        </span>
      )}
    </div>
  )
}
