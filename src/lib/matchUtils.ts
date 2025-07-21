import type { Match } from '@/types/entities'

/**
 * Retorna os IDs de jogadores que já estão em partidas em andamento.
 *
 * @param matches       Todas as partidas conhecidas.
 * @param excludeMatchIds  IDs de partidas a ignorar (útil ao editar uma partida específica).
 */
export function getBusyPlayerIds(matches: Match[], excludeMatchIds: string[] = []): Set<string> {
  const ids = new Set<string>()

  matches.forEach((m) => {
    if (m.status !== 'ongoing' || excludeMatchIds.includes(m.id)) return
    ids.add(m.teamAPlayer1)
    ids.add(m.teamAPlayer2)
    ids.add(m.teamBPlayer1)
    ids.add(m.teamBPlayer2)
  })

  return ids
}
