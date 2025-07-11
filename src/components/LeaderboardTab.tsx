import { type FC, useMemo } from 'react'
import { Info } from 'lucide-react'

import { usePlayers } from '@/context/PlayersContext'
import { readAllCourtMatches } from '@/storage/courtMatchesStorage'
import type { PlayerLBRow, UnsavedRound } from '@/types/players'

// shadcn/ui
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

/* --------------------------------------------------------------------------
 * Types & pure helpers
 * ------------------------------------------------------------------------ */
type Stat = { W: number; L: number; GP: number; GC: number }
type PairStat = { gp: number; gc: number }
type Pair = Map<string, Map<string, PairStat>>
type H2H = Map<string, Map<string, number>>

/* acumula vitórias / games, H2H e placares entre pares ------------------- */
function accumulate(rounds: UnsavedRound[]) {
  const stats = new Map<string, Stat>()
  const h2h: H2H = new Map()
  const pair: Pair = new Map()

  const incStat = (id: string, d: Partial<Stat>) => {
    const s = stats.get(id) ?? { W: 0, L: 0, GP: 0, GC: 0 }
    stats.set(id, {
      W: s.W + (d.W ?? 0),
      L: s.L + (d.L ?? 0),
      GP: s.GP + (d.GP ?? 0),
      GC: s.GC + (d.GC ?? 0),
    })
  }
  const incH2H = (w: string, l: string) => {
    const inner = h2h.get(w) ?? new Map<string, number>()
    inner.set(l, (inner.get(l) ?? 0) + 1)
    h2h.set(w, inner)
  }
  const incPair = (a: string, b: string, gp: number, gc: number) => {
    const inner = pair.get(a) ?? new Map<string, PairStat>()
    const cur = inner.get(b) ?? { gp: 0, gc: 0 }
    inner.set(b, { gp: cur.gp + gp, gc: cur.gc + gc })
    pair.set(a, inner)
  }

  for (const r of rounds)
    for (const m of r.matches) {
      if (m.gamesA == null || m.gamesB == null) continue
      const { gamesA: gA, gamesB: gB, teamA, teamB } = m

      const winners = gA > gB ? teamA : teamB
      const losers = gA > gB ? teamB : teamA
      const winGames = Math.max(gA, gB)
      const loseGames = Math.min(gA, gB)

      winners.forEach((p) => incStat(p.id, { W: 1, GP: winGames, GC: loseGames }))
      losers.forEach((p) => incStat(p.id, { L: 1, GP: loseGames, GC: winGames }))

      winners.forEach((w) => losers.forEach((l) => incH2H(w.id, l.id)))
      teamA.forEach((pA) =>
        teamB.forEach((pB) => {
          incPair(pA.id, pB.id, gA, gB)
          incPair(pB.id, pA.id, gB, gA)
        }),
      )
    }

  return { stats, h2h, pair }
}

/* mini-SV --------------------------------------------------------------- */
function applyMiniSv(rows: PlayerLBRow[], pair: Pair): PlayerLBRow[] {
  const ids = rows.map((p) => p.id)
  const enriched = rows.map((p) => {
    let W = 0,
      L = 0
    ids.forEach((opp) => {
      if (opp === p.id) return
      const vs = pair.get(p.id)?.get(opp)
      const vsOp = pair.get(opp)?.get(p.id)
      if (!vs || !vsOp) return
      if (vs.gp > vs.gc) W++
      else if (vs.gp < vs.gc) L++
    })
    return { ...p, miniW: W, miniL: L, miniSV: W - L, oppMini: ids.filter((x) => x !== p.id) }
  })
  return enriched.sort((a, b) => b.miniSV! - a.miniSV! || a.name.localeCompare(b.name))
}

/* mini-SG --------------------------------------------------------------- */
function applyMiniSg(rows: PlayerLBRow[], pair: Pair): PlayerLBRow[] {
  const ids = rows.map((p) => p.id)
  const enriched = rows.map((p) => {
    let gp = 0,
      gc = 0
    ids.forEach((opp) => {
      if (opp === p.id) return
      const vs = pair.get(p.id)?.get(opp)
      if (vs) {
        gp += vs.gp
        gc += vs.gc
      }
    })
    return { ...p, GPmini: gp, GCmini: gc, miniSG: gp - gc, oppMini: p.oppMini }
  })
  return enriched.sort((a, b) => b.miniSG! - a.miniSG! || a.name.localeCompare(b.name))
}

/* tooltip helpers ------------------------------------------------------- */
const svTip = (p: PlayerLBRow, all: PlayerLBRow[]) => {
  if (!p.oppMini?.length || (p.miniSV ?? 0) === 0) return ''
  const sign = p.miniSV > 0 ? '+' : ''
  const vWord = p.miniW === 1 ? 'vitória' : 'vitórias'
  const lWord = p.miniL === 1 ? 'derrota' : 'derrotas'
  const txt = `teve ${p.miniW} ${vWord} e ${p.miniL} ${lWord} (saldo ${sign}${p.miniSV}).`
  if (p.oppMini.length === 1) {
    const opp = all.find((x) => x.id === p.oppMini[0])?.name ?? 'adversário'
    return `Contra ${opp}, você ${txt}`
  }
  return `Na mini-liga, você ${txt}`
}

const sgTip = (p: PlayerLBRow, all: PlayerLBRow[]) => {
  if (!p.oppMini?.length || (p.miniSG ?? 0) === 0) return ''
  const sign = p.miniSG > 0 ? '+' : ''
  const gWord = p.GPmini === 1 ? 'game' : 'games'
  const txt = `ganhou ${p.GPmini} ${gWord} e perdeu ${p.GCmini} (saldo ${sign}${p.miniSG}).`
  if (p.oppMini.length === 1) {
    const opp = all.find((x) => x.id === p.oppMini[0])?.name ?? 'adversário'
    return `Contra ${opp}, você ${txt}`
  }
  return `Na mini-liga, você ${txt}`
}

/* --------------------------------------------------------------------------
 * Component
 * ------------------------------------------------------------------------ */
const LeaderboardTab: FC = () => {
  const { players } = usePlayers()
  const rounds: UnsavedRound[] = useMemo(() => Object.values(readAllCourtMatches()).flat(), [])

  const { rows, showTooltip } = useMemo(() => {
    const { stats, h2h, pair } = accumulate(rounds)

    /* monta linhas base */
    const base: PlayerLBRow[] = players.map((p) => {
      const { W, L, GP, GC } = stats.get(p.id) ?? { W: 0, L: 0, GP: 0, GC: 0 }
      return { ...p, P: W * 3, SV: W - L, SG: GP - GC, W, L }
    })

    /* ordenação primária + H2H */
    const cmpPrimary = (a: PlayerLBRow, b: PlayerLBRow) => {
      if (b.P !== a.P) return b.P - a.P
      if (b.SV !== a.SV) return b.SV - a.SV
      if (b.SG !== a.SG) return b.SG - a.SG
      const hA = h2h.get(a.id)?.get(b.id) ?? 0
      const hB = h2h.get(b.id)?.get(a.id) ?? 0
      if (hA !== hB) return hB - hA
      return a.name.localeCompare(b.name)
    }
    const samePrimary = (a: PlayerLBRow, b: PlayerLBRow) =>
      a.P === b.P &&
      a.SV === b.SV &&
      a.SG === b.SG &&
      (h2h.get(a.id)?.get(b.id) ?? 0) === (h2h.get(b.id)?.get(a.id) ?? 0)

    base.sort(cmpPrimary)

    /* mini-liga tie-break */
    let i = 0
    while (i < base.length) {
      let j = i + 1
      while (j < base.length && samePrimary(base[i], base[j])) j++

      if (j - i > 1) {
        const tied = base.slice(i, j)
        const afterSv = applyMiniSv(tied, pair)

        /* agrupa por miniSV e aplica miniSG se necessário */
        const groups: PlayerLBRow[][] = []
        let k = 0
        while (k < afterSv.length) {
          let l = k + 1
          while (l < afterSv.length && afterSv[k].miniSV === afterSv[l].miniSV) l++
          groups.push(afterSv.slice(k, l))
          k = l
        }

        const resolved = groups.flatMap((g) => (g.length > 1 ? applyMiniSg(g, pair) : g))
        base.splice(i, j - i, ...resolved)
      }
      i = j
    }

    const tooltip = base.some((p) => (p.miniSV ?? 0) !== 0 || (p.miniSG ?? 0) !== 0)
    return { rows: base, showTooltip: tooltip }
  }, [players, rounds])

  /* exibe mesma posição se empate total --------------------------- */
  const rankNumbers: number[] = []
  rows.forEach((p, idx) => {
    if (idx === 0) {
      rankNumbers.push(1)
      return
    }
    const prev = rows[idx - 1]
    const tied =
      p.P === prev.P &&
      p.SV === prev.SV &&
      p.SG === prev.SG &&
      (p.miniSV ?? 0) === (prev.miniSV ?? 0) &&
      (p.miniSG ?? 0) === (prev.miniSG ?? 0)
    rankNumbers.push(tied ? rankNumbers[idx - 1] : idx + 1)
  })

  /* -------------------------------- UI ---------------------------------- */
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>

      <CardContent>
        {rows.length === 0 ? (
          <p className="italic text-muted-foreground">Nenhum jogador cadastrado.</p>
        ) : (
          <TooltipProvider delayDuration={200}>
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 z-20 bg-card/90 backdrop-blur supports-[backdrop-filter]:bg-card/60">
                  <TableHead className="w-8">#</TableHead>
                  <TableHead>Jogador</TableHead>
                  <TableHead className="text-right">P</TableHead>
                  <TableHead className="text-right">V-D</TableHead>
                  <TableHead className="text-right">SV</TableHead>
                  <TableHead className="text-right">SG</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p, idx) => {
                  const showSv = (p.miniSV ?? 0) !== 0
                  const showSg = (p.miniSG ?? 0) !== 0

                  return (
                    <TableRow key={p.id}>
                      <TableCell>{rankNumbers[idx]}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="text-right">{p.P}</TableCell>
                      <TableCell className="text-right">
                        {p.W}-{p.L}
                      </TableCell>
                      <TableCell className="text-right">{p.SV}</TableCell>
                      <TableCell className="text-right">{p.SG}</TableCell>

                      {showTooltip ? (
                        <TableCell className="text-center">
                          {(showSv || showSg) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="h-4 w-4 opacity-70" />
                              </TooltipTrigger>
                              <TooltipContent side="left" className="max-w-xs text-xs space-y-1">
                                {showSv && <p>{svTip(p, rows)}</p>}
                                {showSg && <p>{sgTip(p, rows)}</p>}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </TableCell>
                      ) : (
                        <TableCell /> /* mantém alinhamento */
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        )}

        {rows.length > 0 && (
          <div className="flex flex-col text-xs text-muted-foreground mt-2">
            <p>
              <b>P</b> = Pontos (3 por vitória) &nbsp; | &nbsp;
              <b>V-D</b> = Vitórias-Derrotas &nbsp; | &nbsp;
              <b>SV</b> = Saldo de Vitórias &nbsp; | &nbsp;
              <b>SG</b> = Saldo de Games
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default LeaderboardTab
