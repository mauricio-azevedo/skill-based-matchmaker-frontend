import { useEffect, useRef } from 'react'
import { useMatches } from '@/context/MatchesContext'
import { usePlayers } from '@/context/PlayersContext'
import type { Match } from '@/types/entities'

/**
 * Sincroniza automaticamente as estatísticas de jogadores
 * sempre que o array de partidas mudar.
 */
export function usePlayerMatchSync(): void {
  const { matches } = useMatches()
  const { registerMatch, unregisterMatch } = usePlayers()
  const prevRef = useRef<Record<string, Match>>({})

  useEffect(() => {
    const prev = prevRef.current
    // transforma em lookup por id
    const currById = matches.reduce((acc, m) => ({ ...acc, [m.id]: m }), {} as Record<string, Match>)

    for (const m of Object.values(currById)) {
      const old = prev[m.id]

      // caso 1: acabou agora
      if (m.status === 'completed' && (!old || old.status !== 'completed')) {
        registerMatch(m)
        continue
      }

      // caso 2: já estava completo, mas mudou pontuação
      if (
        old?.status === 'completed' &&
        m.status === 'completed' &&
        (old.gamesA !== m.gamesA || old.gamesB !== m.gamesB)
      ) {
        unregisterMatch(old)
        registerMatch(m)
      }
    }

    prevRef.current = currById
  }, [matches, registerMatch, unregisterMatch])
}
