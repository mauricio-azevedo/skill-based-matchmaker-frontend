import { type FC, useMemo } from 'react'
import { Info } from 'lucide-react'

import { usePlayers } from '@/context/PlayersContext'
import { useMatches } from '@/context/MatchesContext'
import type { Match, Player } from '@/types/entities'

// shadcn/ui components
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { PlayerLBRow } from '@/types/types'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

/* --------------------------------------------------------------------------
 * Types & pure helpers
 * -------------------------------------------------------------------------- */
type Stat = { W: number; L: number; GP: number; GC: number }
type PairStat = { gp: number; gc: number }
type Pair = Map<string, Map<string, PairStat>>
type H2H = Map<string, Map<string, number>>

/**
 * Accumulates overall stats, head-to-head counts, and pairwise game data from flat match list
 */
function accumulate(matches: Match[]) {
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

  for (const m of matches) {
    const { gamesA: gA, gamesB: gB, teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2 } = m
    if (gA == null || gB == null) continue

    const teamA = [teamAPlayer1, teamAPlayer2]
    const teamB = [teamBPlayer1, teamBPlayer2]
    const winners = gA > gB ? teamA : teamB
    const losers = gA > gB ? teamB : teamA
    const winGames = Math.max(gA, gB)
    const loseGames = Math.min(gA, gB)

    // Aggregate W/L and game stats
    winners.forEach((id) => incStat(id, { W: 1, GP: winGames, GC: loseGames }))
    losers.forEach((id) => incStat(id, { L: 1, GP: loseGames, GC: winGames }))

    // Head-to-head tallies
    winners.forEach((w) => losers.forEach((l) => incH2H(w, l)))

    // Pairwise game totals for mini-league
    teamA.forEach((a) =>
      teamB.forEach((b) => {
        incPair(a, b, gA, gB)
        incPair(b, a, gB, gA)
      }),
    )
  }

  return { stats, h2h, pair }
}

/* --------------------------------------------------------------------------
 * Mini-league tie-break helpers
 * -------------------------------------------------------------------------- */
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

/* --------------------------------------------------------------------------
 * Tooltip text generators
 * -------------------------------------------------------------------------- */
const svTip = (p: PlayerLBRow, all: PlayerLBRow[]): string => {
  const miniSV = p.miniSV ?? 0
  const oppMini = p.oppMini ?? []
  if (!oppMini.length || miniSV === 0) return ''

  const sign = miniSV > 0 ? '+' : ''
  const vWord = (p.miniW ?? 0) === 1 ? 'vitória' : 'vitórias'
  const lWord = (p.miniL ?? 0) === 1 ? 'derrota' : 'derrotas'
  const txt = `teve ${p.miniW ?? 0} ${vWord} e ${p.miniL ?? 0} ${lWord} (saldo ${sign}${miniSV}).`

  if (oppMini.length === 1) {
    const oppName = all.find((x) => x.id === oppMini[0])?.name ?? 'adversário'
    return `Contra ${oppName}, você ${txt}`
  }
  return `Na mini-liga, você ${txt}`
}

const sgTip = (p: PlayerLBRow, all: PlayerLBRow[]): string => {
  const miniSG = p.miniSG ?? 0
  const oppMini = p.oppMini ?? []
  if (!oppMini.length || miniSG === 0) return ''

  const sign = miniSG > 0 ? '+' : ''
  const gWord = (p.GPmini ?? 0) === 1 ? 'game' : 'games'
  const txt = `ganhou ${p.GPmini ?? 0} ${gWord} e perdeu ${p.GCmini ?? 0} (saldo ${sign}${miniSG}).`

  if (oppMini.length === 1) {
    const oppName = all.find((x) => x.id === oppMini[0])?.name ?? 'adversário'
    return `Contra ${oppName}, você ${txt}`
  }
  return `Na mini-liga, você ${txt}`
}

/* --------------------------------------------------------------------------
 * Leaderboard component
 * -------------------------------------------------------------------------- */
const LeaderboardTab: FC = () => {
  const { players } = usePlayers()
  const { matches } = useMatches()

  const { rows, showTooltip } = useMemo(() => {
    const { stats, h2h, pair } = accumulate(matches)
    const playersWithAtLeastOneMatch: Player[] = players.filter((p) => p.matchCount > 0)
    const base: PlayerLBRow[] = playersWithAtLeastOneMatch.map((p) => {
      const { W, L, GP, GC } = stats.get(p.id) ?? { W: 0, L: 0, GP: 0, GC: 0 }
      return { ...p, P: W * 3, SV: W - L, SG: GP - GC, W, L }
    })

    // Primary sort: points, win-diff, game-diff, H2H, name
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

    // Apply mini-league tiebreaks
    let i = 0
    while (i < base.length) {
      let j = i + 1
      while (j < base.length && samePrimary(base[i], base[j])) j++
      if (j - i > 1) {
        const tied = base.slice(i, j)
        const afterSv = applyMiniSv(tied, pair)

        // Further group by miniSV and apply miniSG
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
  }, [players, matches])

  // Generate rank numbers (shared on full ties)
  const rankNumbers: number[] = []
  rows.forEach((p, idx) => {
    if (idx === 0) {
      rankNumbers.push(1)
    } else {
      const prev = rows[idx - 1]
      const tied =
        p.P === prev.P &&
        p.SV === prev.SV &&
        p.SG === prev.SG &&
        (p.miniSV ?? 0) === (prev.miniSV ?? 0) &&
        (p.miniSG ?? 0) === (prev.miniSG ?? 0)
      rankNumbers.push(tied ? rankNumbers[idx - 1] : idx + 1)
    }
  })

  return (
    <div className="flex flex-col w-full h-full">
      <h2 className="text-lg font-semibold leading-tight m-0 text-center">Leaderboard</h2>
      <Separator className="mt-2 mb-0" />

      <div className="flex flex-col overflow-y-auto pl-4 mt-4">
        {rows.length === 0 ? (
          <p className="italic text-muted-foreground">Nenhum jogador cadastrado.</p>
        ) : (
          <TooltipProvider delayDuration={200}>
            <Table>
              <TableHeader>
                <TableRow className="sticky top-0 z-20 bg-background pointer-events-none">
                  <TableHead>#</TableHead>
                  <TableHead className="w-full">Jogador</TableHead>
                  <TableHead>P</TableHead>
                  <TableHead>V-D</TableHead>
                  <TableHead>SV</TableHead>
                  <TableHead>SG</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((p, idx) => {
                  const showSv = (p.miniSV ?? 0) !== 0
                  const showSg = (p.miniSG ?? 0) !== 0

                  return (
                    <TableRow key={p.id} className="pointer-events-none">
                      <TableCell>{rankNumbers[idx]}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="text-right">{p.P}</TableCell>
                      <TableCell className="text-right">
                        {p.W}-{p.L}
                      </TableCell>
                      <TableCell className="text-right">{p.SV}</TableCell>
                      <TableCell className={cn('text-right', !showTooltip && 'pr-4')}>{p.SG}</TableCell>

                      {showTooltip ? (
                        <TableCell className="text-center pr-4">
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
                        <TableCell /> // Align empty cell
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
              <b>P</b> = Pontos (3 por vitória) | <b>V-D</b> = Vitórias-Derrotas
              <br />
              <b>SV</b> = Saldo de Vitórias | <b>SG</b> = Saldo de Games
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default LeaderboardTab
