import { useEffect, useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import type { Match } from '@/types/players'

interface Props {
  match?: Match
  onSave?: (gamesA: number, gamesB: number) => void
}

/**
 * Cartão de uma partida (mobile-first).
 * • Inputs numéricos pequenos + botão 100 % largura, fáceis de tocar.
 * • Atualiza placar a cada troca de partida.
 */
export function MatchCard({ match, onSave }: Props) {
  /* estado local (placar em edição) */
  const [a, setA] = useState<number | ''>('')
  const [b, setB] = useState<number | ''>('')

  /* sincroniza quando o usuário muda de partida */
  useEffect(() => {
    setA(match?.gamesA ?? '')
    setB(match?.gamesB ?? '')
  }, [match])

  const dirty = match !== undefined && ((match.gamesA ?? '') !== a || (match.gamesB ?? '') !== b)

  /* placeholder – nenhuma partida */
  if (!match) return <span className="text-muted-foreground text-sm">Nenhuma partida gerada.</span>

  return (
    <div className="flex flex-col gap-3">
      {/* nomes dos jogadores */}
      <div className="flex flex-col text-center text-sm leading-tight">
        <span className="font-medium break-words">
          {match.teamA[0].name} & {match.teamA[1].name}
        </span>
        <span className="text-xs text-muted-foreground">vs.</span>
        <span className="font-medium break-words">
          {match.teamB[0].name} & {match.teamB[1].name}
        </span>
      </div>

      {/* placar + botão */}
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

      <Button size="sm" className="w-full" disabled={!dirty || a === '' || b === ''} onClick={() => onSave?.(+a, +b)}>
        Salvar placar
      </Button>

      {/* vencedor, se já definido */}
      {match.winner && (
        <span className="text-xs italic text-muted-foreground text-center">
          Vencedor: {match.winner === 'A' ? 'Equipe A' : 'Equipe B'}
        </span>
      )}
    </div>
  )
}
