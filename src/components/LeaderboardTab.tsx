import { type FC, useMemo } from 'react'
import { Info } from 'lucide-react'

import { usePlayers } from '@/context/PlayersContext'
import { useMatches } from '@/context/MatchesContext'
import type { Match, Player } from '@/types/entities'

// shadcn/ui components
import { TooltipProvider } from '@/components/ui/tooltip'
import type { PlayerLBRow } from '@/types/types'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

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
    return `Contra ${oppName}, ${p.name} ${txt}`
  }
  return `Na mini-liga, ${p.name} ${txt}`
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
    return `Contra ${oppName}, ${p.name} ${txt}`
  }
  return `Na mini-liga, ${p.name} ${txt}`
}

/* --------------------------------------------------------------------------
 * Leaderboard component
 * -------------------------------------------------------------------------- */
const LeaderboardTab: FC = () => {
  const { players } = usePlayers()
  const { matches } = useMatches()

  const { rows, showTooltip } = useMemo(() => {
    const { stats, h2h, pair } = accumulate(matches)
    const playersWithAtLeastOneMatch: Player[] = players.filter((p) => stats.has(p.id))
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

  // Gera números de posição em dense ranking (1, 2, 2, 2, …, 3, 3, 3, 4, 4)
  const rankNumbers: number[] = []
  let currentRank = 1

  if (rows.length > 0) {
    rankNumbers.push(currentRank)

    for (let i = 1; i < rows.length; i++) {
      const prev = rows[i - 1]
      const curr = rows[i]
      const tied =
        curr.P === prev.P &&
        curr.SV === prev.SV &&
        curr.SG === prev.SG &&
        (curr.miniSV ?? 0) === (prev.miniSV ?? 0) &&
        (curr.miniSG ?? 0) === (prev.miniSG ?? 0)

      if (!tied) {
        currentRank += 1
      }
      rankNumbers.push(currentRank)
    }
  }

  return (
    <div className="flex flex-col w-full h-full">
      <h2 className="text-lg font-semibold leading-tight m-0 text-center">Leaderboard</h2>
      <Separator className="mt-2 mb-0" />

      {rows.length === 0 ? (
        <div className="h-full flex items-center justify-center">
          <p className="text-md text-muted-foreground">Nenhuma partida concluída ainda.</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col overflow-y-auto overscroll-y-contain px-4 mt-4">
            <TooltipProvider delayDuration={200}>
              {/* container com display table */}
              <div role="table" className="table w-full">
                {/* cabeçalho */}
                <div role="rowgroup" className="table-header-group">
                  <div role="row" className="table-row sticky top-0 z-20 bg-background font-medium">
                    <div role="columnheader" className="table-cell p-2 border-b border-t">
                      #
                    </div>
                    <div role="columnheader" className="table-cell p-2 border-b border-t w-full">
                      Jogador
                    </div>
                    <div role="columnheader" className="table-cell p-2 border-b border-t text-nowrap">
                      P
                    </div>
                    <div role="columnheader" className="table-cell p-2 border-b border-t text-nowrap">
                      V-D
                    </div>
                    <div role="columnheader" className="table-cell p-2 border-b border-t text-nowrap">
                      SV
                    </div>
                    <div role="columnheader" className="table-cell p-2 border-b border-t text-nowrap">
                      SG
                    </div>
                    {showTooltip ? <div role="columnheader" className="table-cell p-2 border-b border-t" /> : null}
                  </div>
                </div>

                {/* corpo */}
                <div role="rowgroup" className="table-row-group text-sm ">
                  {rows.map((p, idx) => {
                    const isLastRow = idx === rows.length - 1
                    const cellClass: string = isLastRow ? 'table-cell p-2' : 'table-cell p-2 border-b'

                    const showSv = (p.miniSV ?? 0) !== 0
                    const showSg = (p.miniSG ?? 0) !== 0

                    return (
                      <div key={p.id} role="row" className="table-row">
                        <div role="cell" className={cn(cellClass)}>
                          {rankNumbers[idx]}
                        </div>
                        <div role="cell" className={cn(cellClass)}>
                          {p.name}
                        </div>
                        <div role="cell" className={cn('text-center', cellClass)}>
                          {p.P}
                        </div>
                        <div role="cell" className={cn('text-center', cellClass)}>
                          {p.W}-{p.L}
                        </div>
                        <div role="cell" className={cn('text-center', cellClass)}>
                          {p.SV}
                        </div>
                        <div role="cell" className={cn('text-center', cellClass)}>
                          {p.SG}
                        </div>

                        {showTooltip ? (
                          <div role="cell" className={cn('text-center', cellClass)}>
                            {showSv || showSg ? (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Info className="h-4 w-4 opacity-70 cursor-pointer" />
                                </PopoverTrigger>

                                <PopoverContent side="left" align="center" className="max-w-xs text-xs space-y-1">
                                  {showSv && <p>{svTip(p, rows)}</p>}
                                  {showSg && <p>{sgTip(p, rows)}</p>}
                                </PopoverContent>
                              </Popover>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            </TooltipProvider>
          </div>
          <div className="w-[calc(100vw-2rem)] border-b mx-auto"></div>
        </>
      )}

      {rows.length > 0 && (
        <div className="flex flex-col text-xs text-muted-foreground mt-2 pl-4">
          <p>
            <b>P</b> = Pontos (3 por vitória) | <b>V-D</b> = Vitórias-Derrotas
            <br />
            <b>SV</b> = Saldo de Vitórias | <b>SG</b> = Saldo de Games
          </p>
        </div>
      )}
    </div>
  )
}

export default LeaderboardTab
