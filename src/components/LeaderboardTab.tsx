import React from 'react'
import { usePlayers } from '../context/PlayersContext'

const LeaderboardTab: React.FC = () => {
  const { players } = usePlayers()
  // Placeholder: just list players alphabetically for now
  const sorted = [...players].sort((a, b) => a.name.localeCompare(b.name))
  return (
    <div className="p-4 max-w-md mx-auto">
      <ul className="space-y-2">
        {sorted.map((p) => (
          <li key={p.id} className="flex justify-between border rounded p-2">
            <span>{p.name}</span>
            <span className="badge">Lv {p.level}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-sm opacity-60">Win tracking coming soon…</p>
    </div>
  )
}

export default LeaderboardTab
