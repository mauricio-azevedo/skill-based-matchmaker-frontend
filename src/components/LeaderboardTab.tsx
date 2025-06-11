import React from 'react'
import { usePlayers } from '../context/PlayersContext'
import { useRounds } from '../context/RoundsContext'

const LeaderboardTab: React.FC = () => {
  const { players } = usePlayers()
  const { rounds } = useRounds()

  // 1. acumula pontos
  const points = new Map<string, number>() // playerId → P
  for (const r of rounds) {
    for (const m of r.matches) {
      if (m.winner === 'A' || m.winner === 'B') {
        const team = m.winner === 'A' ? m.teamA : m.teamB
        for (const p of team) points.set(p.id, (points.get(p.id) ?? 0) + 3)
      }
    }
  }

  // 2. junta com dados de jogador
  const rows = players.map((p) => ({
    ...p,
    P: points.get(p.id) ?? 0,
  }))

  // 3. ordena desc por pontos, depois nome p/ desempate
  rows.sort((a, b) => (b.P !== a.P ? b.P - a.P : a.name.localeCompare(b.name)))

  return (
    <div className="p-4 max-w-md mx-auto">
      {rows.length === 0 ? (
        <p className="italic opacity-60">Nenhum jogador cadastrado.</p>
      ) : (
        <table className="table w-full">
          <thead>
            <tr>
              <th>#</th>
              <th>Jogador</th>
              <th className="text-right">P</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, idx) => (
              <tr key={p.id} className={idx === 0 ? 'font-bold' : ''}>
                <td>{idx + 1}</td>
                <td>{p.name}</td>
                <td className="text-right">{p.P}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default LeaderboardTab
