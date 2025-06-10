// ============================================================================
// src/components/MatchesTab.tsx – Interface de geração de partidas
// ============================================================================
import React, { useState } from 'react'
import { usePlayers } from '../context/PlayersContext'
import type { Player } from '../context/PlayersContext'
import { generateMatches, type Match } from '../lib/algorithm'

const PLAYERS_PER_MATCH = 4 as const

// ---------------------------------------------------------------------------
// Componente principal que mostra controles + lista de partidas.
// ---------------------------------------------------------------------------
const MatchesTab: React.FC = () => {
  // players – array reativo vindo do contexto global.  Qualquer inserção /
  // remoção em PlayersProvider dispara rerender aqui.
  const { players } = usePlayers()

  // matches – lista de partidas geradas pela última chamada a generate().
  const [matches, setMatches] = useState<Match[]>([])

  // -------------------------------------------------------------------------
  // generate() encapsula a regra de negócio pesada importada de algorithm.ts.
  // - Recebemos de volta lista de partidas.
  // -------------------------------------------------------------------------
  const generate = () => {
    const newMatches = generateMatches(players)

    printMatchCounts(newMatches)

    // somar, não trocar
    setMatches((prev) => [...prev, ...newMatches])
  }

  // -------------------------------------------------------------------------
  // Renderização declarativa com Tailwind / DaisyUI:
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

// ---------------------------------------------------------------------------
// Estatísticas de participação por jogador
// ---------------------------------------------------------------------------

/** Conta quantas partidas cada jogador disputou.
 *  Retorna um Map<playerId, número de partidas>.
 */
function countMatches(playersMatches: Match[]): Map<Player['id'], number> {
  const counts = new Map<Player['id'], number>()

  for (const { teamA, teamB } of playersMatches) {
    for (const p of [...teamA, ...teamB]) {
      counts.set(p.id, (counts.get(p.id) ?? 0) + 1)
    }
  }

  return counts
}

/** Imprime no console, em ordem decrescente, o total de partidas por jogador. */
function printMatchCounts(playersMatches: Match[]): void {
  const counts = countMatches(playersMatches)

  console.log('Partidas jogadas por jogador:')
  ;[...counts.entries()]
    .sort(([, a], [, b]) => b - a) // maior → menor
    .forEach(([id, n]) => console.log(`• Jogador ${id}: ${n} partida(s)`))
}
