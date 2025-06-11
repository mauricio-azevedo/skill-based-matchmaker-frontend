import React from 'react'
import { usePlayers } from '../context/PlayersContext'
import { useRounds } from '../context/RoundsContext'

type Stat = { W: number; L: number }

const LeaderboardTab: React.FC = () => {
  const { players } = usePlayers()
  const { rounds } = useRounds()

  // 1. acumula pontos
  const stats = new Map<string, Stat>() // id → {W,L}
  const inc = (id: string, field: keyof Stat) => {
    const s = stats.get(id) ?? { W: 0, L: 0 }
    s[field] += 1
    stats.set(id, s)
  }

  for (const r of rounds) {
    for (const m of r.matches) {
      if (!m.winner) continue
      const winners = m.winner === 'A' ? m.teamA : m.teamB
      const losers = m.winner === 'A' ? m.teamB : m.teamA
      winners.forEach((p) => inc(p.id, 'W'))
      losers.forEach((p) => inc(p.id, 'L'))
    }
  }

  // 2. junta com dados de jogador
  const rows = players.map((p) => {
    const { W = 0, L = 0 } = stats.get(p.id) ?? {}
    const P = W * 3
    const SV = W - L
    return { ...p, W, L, P, SV }
  })

  // 3. ordena desc por pontos, depois nome p/ desempate
  rows.sort((a, b) => (b.P !== a.P ? b.P - a.P : b.SV !== a.SV ? b.SV - a.SV : a.name.localeCompare(b.name)))

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
              <th className="text-right">SV</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, idx) => (
              <tr key={p.id} className={idx === 0 ? 'font-bold' : ''}>
                <td>{idx + 1}</td>
                <td>{p.name}</td>
                <td className="text-right">{p.P}</td>
                <td className="text-right">{p.SV}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default LeaderboardTab
