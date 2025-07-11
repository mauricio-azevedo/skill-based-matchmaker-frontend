import type { Match } from '@/types/players'

interface MatchCardProps {
  match?: Match | null
}

/**
 * Exibe uma partida ou uma mensagem “vazia”.
 * Pode ser reutilizado em qualquer lugar do app.
 */
export function MatchCard({ match }: MatchCardProps) {
  if (!match) {
    return <span className="text-muted-foreground">Nenhuma partida gerada ainda.</span>
  }

  return (
    <div className="flex flex-col gap-1">
      <span className="font-medium">
        {match.teamA[0].name} &amp; {match.teamA[1].name}
      </span>
      <span className="text-sm text-muted-foreground">vs.</span>
      <span className="font-medium">
        {match.teamB[0].name} &amp; {match.teamB[1].name}
      </span>
    </div>
  )
}
