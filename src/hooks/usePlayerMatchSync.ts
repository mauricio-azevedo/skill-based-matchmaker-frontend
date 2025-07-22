import { useEffect, useRef } from 'react'
import { useMatches } from '@/context/MatchesContext'
import { usePlayers } from '@/context/PlayersContext'
import type { Match } from '@/types/entities'

/**
 * Mantém as estatísticas dos jogadores em sincronia com a lista de partidas.
 * – Não duplica dados ao recarregar a página.
 * – Desfaz estatísticas se uma partida concluída for removida.
 */
export function usePlayerMatchSync(): void {
  const { matches } = useMatches()
  const { registerMatch, unregisterMatch } = usePlayers()

  /** snapshot da render anterior (lookup por id) */
  const prevRef = useRef<Record<string, Match>>({})
  /** evita processar logo após o carregamento inicial */
  const bootstrapped = useRef(false)

  useEffect(() => {
    const currById = Object.fromEntries(matches.map((m) => [m.id, m])) as Record<string, Match>

    // Primeira execução: só salva o estado e sai
    if (!bootstrapped.current) {
      prevRef.current = currById
      bootstrapped.current = true
      return
    }

    const prevById = prevRef.current

    /* ─── Partidas adicionadas ou alteradas ─── */
    for (const match of Object.values(currById)) {
      const old = prevById[match.id]

      // acabou agora
      if (match.status === 'completed' && (!old || old.status !== 'completed')) {
        registerMatch(match)
        continue
      }

      // já estava completa e pontuação mudou
      if (
        old?.status === 'completed' &&
        match.status === 'completed' &&
        (old.gamesA !== match.gamesA || old.gamesB !== match.gamesB)
      ) {
        unregisterMatch(old)
        registerMatch(match)
      }
    }

    /* ─── Partidas removidas ─── */
    for (const old of Object.values(prevById)) {
      if (!currById[old.id] && old.status === 'completed') {
        unregisterMatch(old)
      }
    }

    prevRef.current = currById
  }, [matches, registerMatch, unregisterMatch])
}
