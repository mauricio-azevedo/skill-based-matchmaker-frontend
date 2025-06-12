// src/components/LeaderboardTab.tsx

import { type FC } from 'react'
import { Info } from 'lucide-react'

import { usePlayers } from '@/context/PlayersContext'
import { useRounds } from '@/context/RoundsContext'
import type { PlayerLBRow } from '@/types/players'

// shadcn/ui
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

/* -------------------------------------------------------------------------- */
/*                              Type Helpers                                  */
/* -------------------------------------------------------------------------- */
type Stat = { W: number; L: number; GP: number; GC: number }
type PairStat = { gp: number; gc: number }
// Map A → Map B → games pró/contra
type Pair = Map<string, Map<string, PairStat>>

/* -------------------------------------------------------------------------- */
/*                                Component                                   */
/* -------------------------------------------------------------------------- */
const LeaderboardTab: FC = () => {
  const { players } = usePlayers()
  const { rounds } = useRounds()

  /* ----------------------------- Aggregations ------------------------------ */
  const stats = new Map<string, Stat>()
  const get = (id: string) => stats.get(id) ?? { W: 0, L: 0, GP: 0, GC: 0 }

  const h2h = new Map<string, Map<string, number>>()
  const incH2H = (w: string, l: string) => {
    const inner = h2h.get(w) ?? new Map<string, number>()
    inner.set(l, (inner.get(l) ?? 0) + 1)
    h2h.set(w, inner)
  }

  const pair: Pair = new Map()
  const incPair = (pId: string, oppId: string, gp: number, gc: number) => {
    const inner = pair.get(pId) ?? new Map<string, PairStat>()
    const cur = inner.get(oppId) ?? { gp: 0, gc: 0 }
    inner.set(oppId, { gp: cur.gp + gp, gc: cur.gc + gc })
    pair.set(pId, inner)
  }

  /* -------------------------- Walk through rounds ------------------------- */
  for (const r of rounds) {
    for (const m of r.matches) {
      if (m.gamesA === null || m.gamesB === null) continue
      const { gamesA: gA, gamesB: gB, teamA, teamB } = m
      const winners = gA > gB ? teamA : teamB
      const losers = gA > gB ? teamB : teamA
      const winningGames = gA > gB ? gA : gB
      const losingGames = gA > gB ? gB : gA

      winners.forEach((p) => {
        const s = get(p.id)
        s.W++
        s.GP += winningGames
        s.GC += losingGames
        stats.set(p.id, s)
      })
      losers.forEach((p) => {
        const s = get(p.id)
        s.L++
        s.GP += losingGames
        s.GC += winningGames
        stats.set(p.id, s)
      })

      winners.forEach((pW) => losers.forEach((pL) => incH2H(pW.id, pL.id)))
      teamA.forEach((pA) =>
        teamB.forEach((pB) => {
          incPair(pA.id, pB.id, gA, gB)
          incPair(pB.id, pA.id, gB, gA)
        }),
      )
    }
  }

  /* --------------------------- Compose rows ------------------------------- */
  const rows: PlayerLBRow[] = players.map((p) => {
    const { W, L, GP, GC } = stats.get(p.id) ?? { W: 0, L: 0, GP: 0, GC: 0 }
    const P = W * 3
    const SV = W - L
    const SG = GP - GC
    return { ...p, P, SV, SG }
  })

  /* --------------------------- Sort helpers -------------------------------- */
  function comparePlayers(a: PlayerLBRow, b: PlayerLBRow) {
    if (b.P !== a.P) return b.P - a.P
    if (b.SV !== a.SV) return b.SV - a.SV
    if (b.SG !== a.SG) return b.SG - a.SG
    const winsA = h2h.get(a.id)?.get(b.id) ?? 0
    const winsB = h2h.get(b.id)?.get(a.id) ?? 0
    if (winsA !== winsB) return winsB - winsA
    return a.name.localeCompare(b.name)
  }

  function equalPrimary(a: PlayerLBRow, b: PlayerLBRow) {
    if (a.P !== b.P || a.SV !== b.SV || a.SG !== b.SG) return false
    const winsA = h2h.get(a.id)?.get(b.id) ?? 0
    const winsB = h2h.get(b.id)?.get(a.id) ?? 0
    return winsA === winsB
  }

  rows.sort(comparePlayers)

  /* ------------------------ Mini-liga tie-break --------------------------- */
  let i = 0
  while (i < rows.length) {
    let j = i + 1
    while (j < rows.length && equalPrimary(rows[i], rows[j])) j++
    if (j - i > 1) {
      const adjusted = applyMiniTieBreak(rows.slice(i, j), pair)
      rows.splice(i, j - i, ...adjusted)
    }
    i = j
  }

  /* ------------------------------ Render ---------------------------------- */
  return (
    <section className="container mx-auto flex h-full max-w-lg flex-col gap-8 px-4 py-8">
      <Card className="flex min-h-0 flex-col">
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-col p-6">
          <ScrollArea className="min-h-0 flex-1 pr-1">
            {rows.length === 0 ? (
              <p className="italic text-muted-foreground">Nenhum jogador cadastrado.</p>
            ) : (
              <TooltipProvider delayDuration={200}>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Jogador</TableHead>
                      <TableHead className="text-right">P</TableHead>
                      <TableHead className="text-right">SV</TableHead>
                      <TableHead className="text-right">SG</TableHead>
                      <TableHead className="w-6" />
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {rows.map((p, idx) => {
                      const tip = formatMiniTooltip(p, rows)
                      return (
                        <TableRow key={p.id} className={idx === 0 ? 'font-bold' : ''}>
                          <TableCell>{idx + 1}</TableCell>
                          <TableCell>{p.name}</TableCell>
                          <TableCell className="text-right">{p.P}</TableCell>
                          <TableCell className="text-right">{p.SV}</TableCell>
                          <TableCell className="text-right">{p.SG}</TableCell>
                          <TableCell className="text-center">
                            {p.miniSG !== undefined && p.miniSG !== 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 opacity-70" />
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs text-xs">
                                  {tip}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </TooltipProvider>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*                          Helper functions                                  */
/* -------------------------------------------------------------------------- */
function applyMiniTieBreak(rows: PlayerLBRow[], pair: Pair): PlayerLBRow[] {
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
    return {
      ...p,
      GPmini: gp,
      GCmini: gc,
      miniSG: gp - gc,
      oppMini: ids.filter((id) => id !== p.id),
    }
  })

  enriched.sort((a, b) => (b.miniSG! !== a.miniSG! ? b.miniSG! - a.miniSG! : a.name.localeCompare(b.name)))
  return enriched
}

function formatMiniTooltip(row: PlayerLBRow, all: PlayerLBRow[]): string {
  if (row.miniSG === undefined) return ''

  const sign = row.miniSG >= 0 ? '+' : ''
  const gpPlural = row.GPmini === 1 ? 'game' : 'games'
  const msg = `você ganhou ${row.GPmini} ${gpPlural} e perdeu ${row.GCmini} (saldo ${sign}${row.miniSG}).`

  if (row.oppMini && row.oppMini.length === 1) {
    const oppName = all.find((r) => r.id === row.oppMini?.[0])?.name ?? 'adversário'
    return `Nos jogos contra ${oppName}, ${msg}`
  }
  return `Nos jogos contra ${row.oppMini!.length + 1} jogadores, ${msg}`
}

export default LeaderboardTab
