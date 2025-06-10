// src/components/MatchesTab.tsx
// -----------------------------------------------------------------------------
// Componente que consome o novo `generateMatches`, que agora devolve também o
// mapa `played`. Mantemos `played` em state local para que chamadas sucessivas
// priorizem quem jogou menos — atendendo às regras de reaproveitamento.
// -----------------------------------------------------------------------------

import React, { useEffect, useState } from 'react'
import { usePlayers } from '../context/PlayersContext'
import type { Player } from '../context/PlayersContext'
import { generateMatches, type PlayedMap, type Match } from '../lib/algorithm'

const MatchesTab: React.FC = () => {
  const { players } = usePlayers()

  const [teamSize, setTeamSize] = useState(2)
  const [played, setPlayed] = useState<PlayedMap>({})
  const [matches, setMatches] = useState<Match[]>([])

  console.log(players, played)

  // ---------------------------------------------------------------------------
  // Gera partidas respeitando o histórico de `played`.
  // ---------------------------------------------------------------------------
  const generate = () => {
    const { matches: m, played: p } = generateMatches(players, teamSize, { ...played })
    setMatches(m)
    setPlayed(p)
  }

  // Gera automaticamente na primeira renderização ou quando a lista de players muda.
  useEffect(() => {
    if (players.length >= teamSize * 2) generate()
  }, [players])

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center space-x-2">
        <label className="label">Team size</label>
        <input
          type="number"
          min={1}
          max={10}
          value={teamSize}
          onChange={(e) => setTeamSize(Number(e.target.value))}
          className="input input-bordered w-24"
        />
        <button className="btn btn-primary" onClick={generate} disabled={players.length < teamSize * 2}>
          Generate
        </button>
      </div>

      {matches.length === 0 && <p>No matches possible ⚠️</p>}

      <ol className="space-y-4">
        {matches.map((m, idx) => (
          <li key={idx} className="border rounded p-4">
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

// -----------------------------------------------------------------------------
// Sub‑componente simples para exibir jogadores de um time.
// -----------------------------------------------------------------------------
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
