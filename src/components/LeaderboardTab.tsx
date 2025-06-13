// src/components/LeaderboardTab.tsx

import { type FC } from 'react'
import { Info } from 'lucide-react'

import { usePlayers } from '@/context/PlayersContext'
import { useRounds } from '@/context/RoundsContext'
import type { PlayerLBRow } from '@/types/players'

// shadcn/ui
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
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
    return { ...p, P, SV, SG, W, L }
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
      const tied = rows.slice(i, j)

      // 1º mini-SV
      const afterMiniSV = applyMiniSvTieBreak(tied, pair)

      // se ainda houver empate de miniSV, aplica mini-SG
      const groups: PlayerLBRow[][] = []
      let k = 0
      while (k < afterMiniSV.length) {
        let l = k + 1
        while (l < afterMiniSV.length && afterMiniSV[k].miniSV === afterMiniSV[l].miniSV) l++
        groups.push(afterMiniSV.slice(k, l))
        k = l
      }

      const resolved = groups.flatMap((g) => (g.length > 1 ? applyMiniTieBreak(g, pair) : g))

      rows.splice(i, j - i, ...resolved)
    }

    i = j
  }

  const showTooltips = rows.some(
    (p) => (p.miniSV !== undefined && p.miniSV !== 0) || (p.miniSG !== undefined && p.miniSG !== 0),
  )

  /* ------------------------------ Render ---------------------------------- */
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard</CardTitle>
      </CardHeader>

      <CardContent className="justify-between">
        {rows.length === 0 ? (
          <p className="italic text-muted-foreground">Nenhum jogador cadastrado.</p>
        ) : (
          <TooltipProvider delayDuration={200}>
            <Table>
              <TableHeader>
                <TableRow
                  className="sticky top-0 z-20 bg-card/90 backdrop-blur
                     supports-[backdrop-filter]:bg-card/60"
                >
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
                  const tipSG = formatMiniSgTooltip(p, rows) // saldo de games
                  const tipSV = formatMiniSvTooltip(p, rows) // saldo de vitórias

                  return (
                    <TableRow key={p.id} className={idx === 0 ? 'font-bold' : ''}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell>{p.name}</TableCell>
                      <TableCell className="text-right">{p.P}</TableCell>
                      <TableCell className="text-right">
                        {p.W}-{p.L}
                      </TableCell>
                      <TableCell className="text-right">{p.SV}</TableCell>
                      <TableCell className="text-right">{p.SG}</TableCell>

                      {/* tie icons */}
                      {showTooltips && (
                        <TableCell className="text-center">
                          <span className="flex items-center justify-center gap-2">
                            {p.miniSV !== undefined && p.miniSV !== 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 opacity-70" />
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs text-xs">
                                  {tipSV}
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {p.miniSG !== undefined && p.miniSG !== 0 && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Info className="h-4 w-4 opacity-70" />
                                </TooltipTrigger>
                                <TooltipContent side="left" className="max-w-xs text-xs">
                                  {tipSG}
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </span>
                        </TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        )}
        {/* legenda simples para leigos */}
        <div className="flex flex-col text-xs text-muted-foreground">
          <p>
            <b>P</b> = Pontos (3 por vitória)
          </p>
          <p>
            <b>V-D</b> = Vitórias‑Derrotas
          </p>
          <p>
            <b>SV</b> = Saldo de Vitórias
          </p>
          <p>
            <b>SG</b> = Saldo de Games
          </p>
        </div>
      </CardContent>
    </Card>
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

function applyMiniSvTieBreak(rows: PlayerLBRow[], pair: Pair): PlayerLBRow[] {
  const ids = rows.map((p) => p.id)

  const enriched = rows.map((p) => {
    let W = 0,
      L = 0
    ids.forEach((opp) => {
      if (opp === p.id) return
      const vs = pair.get(p.id)?.get(opp)
      const vsOpp = pair.get(opp)?.get(p.id)
      if (!vs || !vsOpp) return // nunca se enfrentaram
      if (vs.gp > vs.gc) W++
      else if (vs.gp < vs.gc) L++
    })
    return { ...p, miniW: W, miniL: L, miniSV: W - L }
  })

  // ordena primeiro por miniSV, depois nome (fallback simples)
  enriched.sort((a, b) => (b.miniSV! !== a.miniSV! ? b.miniSV! - a.miniSV! : a.name.localeCompare(b.name)))
  return enriched
}

function formatMiniSgTooltip(row: PlayerLBRow, all: PlayerLBRow[]): string {
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

function formatMiniSvTooltip(row: PlayerLBRow, all: PlayerLBRow[]): string {
  if (row.miniSV === undefined) return ''

  const sign = row.miniSV >= 0 ? '+' : ''
  const wPlural = row.miniW === 1 ? 'vitória' : 'vitórias'
  const lPlural = row.miniL === 1 ? 'derrota' : 'derrotas'
  const msg = `você teve ${row.miniW} ${wPlural} e ${row.miniL} ${lPlural} (saldo ${sign}${row.miniSV}).`

  if (row.oppMini && row.oppMini.length === 1) {
    const oppName = all.find((r) => r.id === row.oppMini?.[0])?.name ?? 'adversário'
    return `Nos confrontos contra ${oppName}, ${msg}`
  }
  return `Nos confrontos entre ${row.oppMini!.length + 1} jogadores, ${msg}`
}

export default LeaderboardTab
