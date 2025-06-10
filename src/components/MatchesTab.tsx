// ============================================================================
// src/components/MatchesTab.tsx – Interface de geração de partidas
// ============================================================================
import React, { useState } from 'react'
import { usePlayers } from '../context/PlayersContext'
import type { Player } from '../context/PlayersContext'
import { generateMatches, type PlayedMap, type Match } from '../lib/algorithm'

const PLAYERS_PER_MATCH = 4 as const

// ---------------------------------------------------------------------------
// Componente principal que mostra controles + lista de partidas.
// Regra de negócio‑chave: Sempre que houver jogadores suficientes, gera
// partidas equilibradas, priorizando quem jogou menos vezes.
// ---------------------------------------------------------------------------
const MatchesTab: React.FC = () => {
  // players – array reativo vindo do contexto global.  Qualquer inserção /
  // remoção em PlayersProvider dispara rerender aqui.
  const { players } = usePlayers()

  // played – mapa id → nº de partidas disputadas.  Mantido localmente para
  // que a UX se lembre da contagem mesmo se o usuário alternar de aba.
  const [played, setPlayed] = useState<PlayedMap>({})
  // matches – lista de partidas geradas pela última chamada a generate().
  const [matches, setMatches] = useState<Match[]>([])

  // Saída de depuração para checagem rápida no DevTools.
  console.log(players, played)

  // -------------------------------------------------------------------------
  // generate() encapsula a regra de negócio pesada importada de algorithm.ts.
  // - Copiamos played (spread) para evitar side‑effects.
  // - Recebemos de volta lista de partidas + novo mapa played, já incrementado.
  // -------------------------------------------------------------------------
  const generate = () => {
    const { matches: novos, played: atualizado } = generateMatches(players, { ...played })

    // somar, não trocar
    setMatches((prev) => [...prev, ...novos])
    setPlayed(atualizado)
  }

  // -------------------------------------------------------------------------
  // Renderização declarativa com Tailwind / DaisyUI:
  //   - Painel de controles (input numeric + botão)
  //   - <ol> de partidas, cada uma com Team A vs Team B.
  // -------------------------------------------------------------------------
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* ---------- CONTROLES ---------- */}
      <div className="flex items-center space-x-2">
        <button className="btn btn-primary" onClick={generate} disabled={players.length < PLAYERS_PER_MATCH}>
          Generate
        </button>
      </div>

      {/* ---------- LISTA DE PARTIDAS ---------- */}
      <ol className="space-y-4">
        {matches.map((m, idx) => (
          <li key={idx} className="border rounded p-4">
            Match #{idx + 1}
            <div className="flex justify-between">
              <TeamView title="Team A" team={m.teamA} />
              <span className="text-xl font-bold self-center">vs</span>
              <TeamView title="Team B" team={m.teamB} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TeamView – componente presentational (stateless) que formata um time.
// Recebe props { title, team } e devolve lista <li> com badge de nível.
// ---------------------------------------------------------------------------
const TeamView: React.FC<{ title: string; team: Player[] }> = ({ title, team }) => (
  <div>
    <h3 className="font-semibold mb-1">{title}</h3>
    <ul>
      {team.map((p) => (
        <li key={p.id}>
          {p.name} <span className="badge ml-1">Lv {p.level}</span>
        </li>
      ))}
    </ul>
  </div>
)

export default MatchesTab
