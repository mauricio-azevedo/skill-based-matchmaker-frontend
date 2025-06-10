// ============================================================================
// src/components/MatchesTab.tsx – Interface de geração de partidas
// ============================================================================
import React, { useState } from 'react'
import { usePlayers } from '../context/PlayersContext'
import type { Player } from '../context/PlayersContext'
import { generateSchedule, type Match, type Round } from '../lib/algorithm'

const PLAYERS_PER_MATCH = 4 as const

// ---------------------------------------------------------------------------
// Componente principal que mostra controles + lista de partidas.
// ---------------------------------------------------------------------------
const MatchesTab: React.FC = () => {
  // players – array reativo vindo do contexto global.  Qualquer inserção /
  // remoção em PlayersProvider dispara rerender aqui.
  const { players } = usePlayers()

  // ---------------------------------------------------------------------------
  // nº de quadras selecionado pelo usuário
  // ---------------------------------------------------------------------------
  const [courts, setCourts] = useState<number>(2) // default 2
  const [rounds, setRounds] = useState<Round[]>([])

  const generate = () => {
    const newRounds = generateSchedule(players, courts)
    setRounds(newRounds) // substitui, não soma
    printMatchCounts(newRounds.flatMap((r) => r.matches))
  }

  // -------------------------------------------------------------------------
  // Renderização declarativa com Tailwind / DaisyUI:
  // -------------------------------------------------------------------------
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* ---------- CONTROLES ---------- */}
      <div className="flex items-center space-x-2">
        <label className="label">Quadras:</label>
        <input
          type="number"
          min={1}
          value={courts}
          onChange={(e) => setCourts(Number(e.target.value))}
          className="input input-bordered w-20"
        />
        <button className="btn btn-primary" onClick={generate} disabled={players.length < PLAYERS_PER_MATCH}>
          Generate
        </button>
      </div>

      {/* ---------- LISTA DE RODADAS ---------- */}
      {rounds.map((r, rIdx) => (
        <div key={rIdx} className="mb-6">
          <h2 className="text-lg font-bold mb-2">Round #{rIdx + 1}</h2>
          <ol className="grid gap-4" style={{ gridTemplateColumns: `repeat(${courts}, minmax(0, 1fr))` }}>
            {' '}
            {r.matches.map((m, mIdx) => (
              <li key={mIdx} className="border rounded p-4">
                <div className="flex justify-between">
                  <TeamView title="Team A" team={m.teamA} />
                  <span className="text-xl font-bold self-center">vs</span>
                  <TeamView title="Team B" team={m.teamB} />
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
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
