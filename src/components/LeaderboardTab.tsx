import React from 'react'
import { usePlayers } from '../context/PlayersContext'
import { useRounds } from '../context/RoundsContext'
import { Info } from 'lucide-react'
import type { PlayerLBRow } from '../types/players.js'

type Stat = { W: number; L: number; GP: number; GC: number }

const LeaderboardTab: React.FC = () => {
  const { players } = usePlayers()
  const { rounds } = useRounds()

  // 1. acumula pontos
  const stats = new Map<string, Stat>()
  const get = (id: string) => stats.get(id) ?? { W: 0, L: 0, GP: 0, GC: 0 }

  const h2h = new Map<string, Map<string, number>>() // winnerId → (loserId → vitórias)
  const incH2H = (w: string, l: string) => {
    const inner = h2h.get(w) ?? new Map<string, number>()
    inner.set(l, (inner.get(l) ?? 0) + 1)
    h2h.set(w, inner)
  }
  const gDiff = new Map<string, Map<string, number>>()
  const incGD = (p: string, opp: string, diff: number) => {
    const inner = gDiff.get(p) ?? new Map<string, number>()
    inner.set(opp, (inner.get(opp) ?? 0) + diff)
    gDiff.set(p, inner)
  }

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

      winners.forEach((pW) => losers.forEach((pL) => incH2H(pW.id, pL.id)))

      m.teamA.forEach((pA) =>
        m.teamB.forEach((pB) => {
          incGD(pA.id, pB.id, gA - gB) // positivo para quem fez mais games
          incGD(pB.id, pA.id, gB - gA)
        }),
      )
    }
  }

  // 2. junta com dados de jogador
  const rows: PlayerLBRow[] = players.map((p) => {
    const { W, L, GP, GC } = stats.get(p.id) ?? { W: 0, L: 0, GP: 0, GC: 0 }
    const P = W * 3
    const SV = W - L
    const SG = GP - GC
    return { ...p, P, SV, SG }
  })

  function comparePlayers(a: (typeof rows)[number], b: (typeof rows)[number]): number {
    if (b.P !== a.P) return b.P - a.P
    if (b.SV !== a.SV) return b.SV - a.SV
    if (b.SG !== a.SG) return b.SG - a.SG

    // — Confronto direto —
    const winsA = h2h.get(a.id)?.get(b.id) ?? 0
    const winsB = h2h.get(b.id)?.get(a.id) ?? 0
    if (winsA !== winsB) return winsB - winsA // quem venceu mais fica na frente

    // Último critério
    return a.name.localeCompare(b.name)
  }

  function equalPrimary(a: PlayerLBRow, b: PlayerLBRow): boolean {
    if (a.P !== b.P) return false
    if (a.SV !== b.SV) return false
    if (a.SG !== b.SG) return false
    const winsA = h2h.get(a.id)?.get(b.id) ?? 0
    const winsB = h2h.get(b.id)?.get(a.id) ?? 0
    return winsA === winsB // H2H empatado
  }

  // 3. ordena desc por pontos, depois nome p/ desempate
  rows.sort(comparePlayers)

  // ───────────────── mini-liga para blocos empatados ─────────────────
  let i = 0
  while (i < rows.length) {
    let j = i + 1
    while (j < rows.length && equalPrimary(rows[i], rows[j])) j++

    if (j - i > 1) {
      const group = rows.slice(i, j)
      const ids = group.map((p) => p.id)

      // calcula saldo de games só dentro da mini-liga
      group.forEach((p) => {
        let mini = 0
        ids.forEach((opp) => {
          if (opp === p.id) return
          mini += gDiff.get(p.id)?.get(opp) ?? 0
        })
        p.miniSG = mini // anexa campo temporário
      })

      group.sort((a, b) => {
        const diff = (b.miniSG ?? 0) - (a.miniSG ?? 0)
        return diff !== 0 ? diff : a.name.localeCompare(b.name)
      })
      rows.splice(i, group.length, ...group)
    }

    i = j
  }

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
              <th className="w-8" />
            </tr>
          </thead>
          <tbody>
            {rows.map((p, idx) => {
              console.log(p)
              const mini = p.miniSG as number | undefined

              return (
                <tr key={p.id} className={idx === 0 ? 'font-bold' : ''}>
                  <td>{idx + 1}</td>
                  <td>{p.name}</td>
                  <td className="text-right">{p.P}</td>
                  <td className="text-right">{p.SV}</td>
                  <td className="text-right">{p.SG}</td>
                  <td className="text-center">
                    {mini !== undefined && (
                      <div className="tooltip tooltip-left" data-tip={`Saldo interno: ${mini >= 0 ? '+' : ''}${mini}`}>
                        <Info className="w-4 h-4 inline-block opacity-70" />
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}

export default LeaderboardTab
