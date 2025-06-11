import React from 'react'
import { usePlayers } from '../context/PlayersContext'
import { useRounds } from '../context/RoundsContext'

type Stat = { W: number; L: number; GP: number; GC: number }

const LeaderboardTab: React.FC = () => {
  const { players } = usePlayers()
  const { rounds } = useRounds()

  // 1. acumula pontos
  const stats = new Map<string, Stat>()
  const get = (id: string) => stats.get(id) ?? { W: 0, L: 0, GP: 0, GC: 0 }

  for (const r of rounds) {
    for (const m of r.matches) {
      if (m.gamesA === null || m.gamesB === null) continue
      const gA = m.gamesA
      const gB = m.gamesB
      const winners = gA > gB ? m.teamA : m.teamB
      const losers = gA > gB ? m.teamB : m.teamA
      const winningGames = gA > gB ? gA : gB
      const losingGames = gA > gB ? gB : gA

      winners.forEach((p) => {
        const s = get(p.id)
        s.W += 1
        s.GP += winningGames
        s.GC += losingGames
        stats.set(p.id, s)
      })

      losers.forEach((p) => {
        const s = get(p.id)
        s.L += 1
        s.GP += losingGames
        s.GC += winningGames
        stats.set(p.id, s)
      })
    }
  }

  // 2. junta com dados de jogador
  const rows = players.map((p) => {
    const { W, L, GP, GC } = stats.get(p.id) ?? { W: 0, L: 0, GP: 0, GC: 0 }
    const P = W * 3
    const SV = W - L
    const SG = GP - GC
    return { ...p, P, SV, SG }
  })

  // 3. ordena desc por pontos, depois nome p/ desempate
  rows.sort((a, b) =>
    b.P !== a.P ? b.P - a.P : b.SV !== a.SV ? b.SV - a.SV : b.SG !== a.SG ? b.SG - a.SG : a.name.localeCompare(b.name),
  )
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
              <th className="text-right">SG</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p, idx) => (
              <tr key={p.id} className={idx === 0 ? 'font-bold' : ''}>
                <td>{idx + 1}</td>
                <td>{p.name}</td>
                <td className="text-right">{p.P}</td>
                <td className="text-right">{p.SV}</td>
                <td className="text-right">{p.SG}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default LeaderboardTab
