import React, { useState } from 'react'
import { usePlayers } from '../context/PlayersContext'
import { generateMatches } from '../lib/algorithm'

const MatchesTab: React.FC = () => {
  const { players } = usePlayers()
  const [teamSize, setTeamSize] = useState(2)
  const [result, setResult] = useState(() => generateMatches(players, 2))

  const refresh = () => setResult(generateMatches(players, teamSize))

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
        <button className="btn btn-primary" onClick={refresh}>
          Generate
        </button>
      </div>

      {result.matches.length === 0 && <p>No matches possible ⚠️</p>}

      <ol className="space-y-4">
        {result.matches.map((m, idx) => (
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

const TeamView: React.FC<{ title: string; team: ReturnType<typeof generateMatches>['matches'][number]['teamA'] }> = ({
  title,
  team,
}) => (
  <div>
    <h3 className="font-semibold">{title}</h3>
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
