import { useEffect, useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { Match } from '@/types/players'

interface Props {
  match?: Match
  /** callback dispara quando os dois placares (1-6) forem selecionados */
  onSave?: (gamesA: number, gamesB: number) => void
}

/**
 * Cartão de partida (mobile-first).
 * Inputs de placar foram trocados por `<Select>` com opções 1-6.
 */
export function MatchCard({ match, onSave }: Props) {
  /* placares locais ('' | 1-6) */
  const [a, setA] = useState<number | ''>('')
  const [b, setB] = useState<number | ''>('')

  /* reseta ao trocar de match */
  useEffect(() => {
    setA(match?.gamesA ?? '')
    setB(match?.gamesB ?? '')
  }, [match])

  const filled = a !== '' && b !== ''
  const dirty = match !== undefined && ((match.gamesA ?? '') !== a || (match.gamesB ?? '') !== b)

  /* salva automaticamente quando válido e alterado */
  useEffect(() => {
    if (match && filled && dirty) onSave?.(+a, +b)
  }, [filled, dirty, a, b, match, onSave])

  /* placeholder */
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

      {/* selects de placar */}
      <div className="flex items-center justify-center gap-2">
        <ScoreSelect value={a} onChange={setA} />
        <span className="text-muted-foreground">x</span>
        <ScoreSelect value={b} onChange={setB} />
      </div>

      {/* vencedor (se já definido) */}
      {match.winner && (
        <span className="text-xs italic text-muted-foreground text-center">
          Vencedor: {match.winner === 'A' ? 'Equipe A' : 'Equipe B'}
        </span>
      )}
    </div>
  )
}

/* -----------------------------------------------------------------------
 * Componente auxiliar: Select 1-6 (placeholder '-')
 * --------------------------------------------------------------------- */
function ScoreSelect({ value, onChange }: { value: number | ''; onChange: (v: number | '') => void }) {
  return (
    <Select value={value === '' ? '' : String(value)} onValueChange={(v) => onChange(v === '' ? '' : +v)}>
      <SelectTrigger className="w-16 h-8 text-center">
        <SelectValue placeholder="-" />
      </SelectTrigger>
      <SelectContent side="bottom">
        {Array.from({ length: 6 }, (_, i) => i + 1).map((n) => (
          <SelectItem key={n} value={String(n)} className="text-sm text-center">
            {n}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
