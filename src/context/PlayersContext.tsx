// ============================================================================
// src/context/PlayersContext.tsx – Estado global de jogadores
// ----------------------------------------------------------------------------
// Centraliza lista de jogadores e suas estatísticas (matchCount e partnerCounts),
// persiste tudo em localStorage e expõe operações CRUD + estatísticas.
// ============================================================================

import React, { createContext, useContext, useEffect, useState } from 'react'
import type { Player } from '../types/players'

// ----------------------------------------------------------------------------
// Helper: retorna o menor matchCount entre um conjunto de players
// ----------------------------------------------------------------------------
function getMinMatchCount(players: Player[]): number {
  if (players.length === 0) return 0
  // começa com o matchCount do primeiro e vai achando o mínimo
  return players.reduce((min, p) => Math.min(min, p.matchCount), players[0].matchCount)
}

// Interface pública do contexto
type Ctx = {
  players: Player[]
  add: (name: string, level: number) => void
  remove: (id: string) => void
  toggleActive: (id: string) => void
  /** Atualiza múltiplos players de uma vez (usado para incrementar estatísticas) */
  updatePlayers: (updater: (players: Player[]) => Player[]) => void
}

// Criamos contexto com undefined para forçar checagem de Provider
const PlayersContext = createContext<Ctx | undefined>(undefined)

// ---------------------------------------------------------------------------
// Provider: envolve toda a aplicação e mantém estado de players
// ---------------------------------------------------------------------------
export const PlayersProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicializa do localStorage na primeira renderização
  const [players, setPlayers] = useState<Player[]>(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('sbm_players') || '[]') as Player[]
      // Garante que cada player tenha active, matchCount e partnerCounts
      return stored.map((p) => ({
        ...p,
        active: p.active !== false,
        matchCount: p.matchCount ?? 0,
        partnerCounts: p.partnerCounts ?? {},
      }))
    } catch {
      return []
    }
  })

  // Sempre que players muda, grava em localStorage
  useEffect(() => {
    localStorage.setItem('sbm_players', JSON.stringify(players))
  }, [players])

  // -----------------------------------------------------------------------------
  // Função add:
  // - Quando um novo jogador entra TARDIO, damos a ele o matchCount mínimo atual.
  // - Assim ele não sai na frente na hora de gerar próximas rodadas.
  // -----------------------------------------------------------------------------
  const add = (name: string, level: number) =>
    setPlayers((prev) => {
      // Se houver jogadores, pega o menor matchCount entre os existentes
      const minCount = getMinMatchCount(prev.filter((pl) => pl.active))

      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          name,
          level,
          active: true,
          matchCount: minCount, // inicia igual ao menor existente
          partnerCounts: {}, // sem parcerias ainda
        },
      ]
    })

  // -----------------------------------------------------------------------------
  // Função remove:
  // - Remove um jogador pelo id (descarta seu histórico).
  // -----------------------------------------------------------------------------
  const remove = (id: string) => setPlayers((p) => p.filter((pl) => pl.id !== id))

  // -----------------------------------------------------------------------------
  // Função toggleActive:
  // - Inativa ou reativa um jogador.
  // - Ao reativar, iguala seu matchCount ao menor entre os ativos,
  //   garantindo que ele não seja priorizado antes de "recuperar" partidas.
  // -----------------------------------------------------------------------------
  const toggleActive = (id: string) =>
    setPlayers((prev) => {
      // Localiza jogador alvo
      const target = prev.find((pl) => pl.id === id)
      if (!target) return prev

      const willActivate = !target.active
      let newMatchCount = target.matchCount

      if (willActivate) {
        // Computa o menor matchCount entre quem já está ativo
        const activePlayers = prev.filter((pl) => pl.active)
        const minMatchCount = getMinMatchCount(activePlayers)
        newMatchCount = minMatchCount > target.matchCount ? minMatchCount : target.matchCount
      }

      // Atualiza somente o player em questão
      return prev.map((pl) => (pl.id === id ? { ...pl, active: willActivate, matchCount: newMatchCount } : pl))
    })

  // -----------------------------------------------------------------------------
  // Função updatePlayers:
  // - Expõe capacidade de atualizar qualquer campo de todos players,
  //   usada para incrementar matchCount e partnerCounts após gerar rodada.
  // -----------------------------------------------------------------------------
  const updatePlayers = (updater: (players: Player[]) => Player[]) => setPlayers(updater)

  return (
    <PlayersContext.Provider value={{ players, add, remove, toggleActive, updatePlayers }}>
      {children}
    </PlayersContext.Provider>
  )
}

// Hook auxiliar: garante Consumer sempre dentro do Provider
export const usePlayers = () => {
  const ctx = useContext(PlayersContext)
  if (!ctx) throw new Error('usePlayers must be inside PlayersProvider')
  return ctx
}
