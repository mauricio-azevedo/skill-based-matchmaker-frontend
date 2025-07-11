import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Match } from '@/types/players'

interface Props {
  match?: Match
  onSave?: (gamesA: number, gamesB: number) => void
}

export function MatchCard({ match, onSave }: Props) {
  /* ───────── estado local ───────── */
  const [a, setA] = useState<number | ''>('')
  const [b, setB] = useState<number | ''>('')

  /* Sincroniza quando o usuário muda de partida */
  useEffect(() => {
    setA(match?.gamesA ?? '')
    setB(match?.gamesB ?? '')
  }, [match])

  /* Derivados */
  const dirty = match !== undefined && ((match.gamesA ?? '') !== a || (match.gamesB ?? '') !== b)

  /* Render vazio */
  if (!match) {
    return <span className="text-muted-foreground">Nenhuma partida gerada.</span>
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Jogadores */}
      <div className="flex flex-col gap-1">
        <span className="font-medium">
          {match.teamA[0].name} &amp; {match.teamA[1].name}
        </span>
        <span className="text-sm text-muted-foreground">vs.</span>
        <span className="font-medium">
          {match.teamB[0].name} &amp; {match.teamB[1].name}
        </span>
      </div>

      {/* Placar */}
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={0}
          value={a}
          onChange={(e) => setA(e.target.value === '' ? '' : +e.target.value)}
          className="w-16 text-center"
        />
        <span className="text-muted-foreground">x</span>
        <Input
          type="number"
          min={0}
          value={b}
          onChange={(e) => setB(e.target.value === '' ? '' : +e.target.value)}
          className="w-16 text-center"
        />
        <Button size="sm" disabled={!dirty || a === '' || b === ''} onClick={() => onSave?.(+a, +b)}>
          Salvar
        </Button>
      </div>

      {/* Vencedor */}
      {match.winner && (
        <span className="text-xs italic text-muted-foreground">
          Vencedor: {match.winner === 'A' ? 'Equipe A' : 'Equipe B'}
        </span>
      )}
    </div>
  )
}
