// ============================================================================
// src/components/MatchesTab.tsx – Interface de geração de partidas (versão 2)
// Design minimalista e "gamificado" inspirada no cuidado de produto da Apple
// ============================================================================
import React, { useState } from 'react'
import { usePlayers } from '../context/PlayersContext'
import type { Player } from '../context/PlayersContext'
import { generateSchedule, type Match, type Round } from '../lib/algorithm'
import { Toaster, toast } from 'react-hot-toast'

const PLAYERS_PER_MATCH = 4 as const

// Quantas colunas deve ter o grid de partidas.  Mantemos inline style porque o
// valor vem de um state dinâmico (courts).
const gridTemplate = (courts: number) => ({ gridTemplateColumns: `repeat(${courts}, minmax(0, 1fr))` })

// ---------------------------------------------------------------------------
// Componente principal – controles + rounds + scoreboard
// ---------------------------------------------------------------------------
const MatchesTab: React.FC = () => {
  // players – estado global
  const { players } = usePlayers()

  // número de quadras (usuário)
  const [courts, setCourts] = useState<number>(2)
  const [rounds, setRounds] = useState<Round[]>([])

  // scoreboard: Map<playerId, n de partidas>
  const [matchCounts, setMatchCounts] = useState<Map<Player['id'], number>>(new Map())

  // -------------------------------------------------------------------------
  // Gera tabelas a partir do algoritmo + actualiza scoreboard
  // -------------------------------------------------------------------------
  const generate = () => {
    try {
      const newRounds = generateSchedule(players, courts)
      setRounds(newRounds)

      const flatMatches = newRounds.flatMap((r) => r.matches)
      setMatchCounts(countMatches(flatMatches))

      printMatchCounts(flatMatches) // consola para debug
    } catch (err) {
      toast.error((err as Error).message, { duration: 6000 })
    }
  }

  // valor máximo para normalizar a barra de progresso
  const maxMatches = React.useMemo(() => Math.max(1, ...Array.from(matchCounts.values())), [matchCounts])

  // -------------------------------------------------------------------------
  // Renderização declarativa DaisyUI
  // -------------------------------------------------------------------------
  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* container de toasts */}
      <Toaster position="top-right" />

      {/* ---------- CONTROLES ---------- */}
      <div className="flex items-end gap-4">
        <label className="form-control w-32">
          <span className="label-text">Quadras</span>
          <input
            type="number"
            min={1}
            value={courts}
            onChange={(e) => setCourts(Number(e.target.value))}
            className="input input-bordered"
          />
        </label>
        <button
          className="btn btn-primary rounded-full"
          onClick={generate}
          disabled={players.length < PLAYERS_PER_MATCH}
        >
          Gerar
        </button>
      </div>

      {/* ---------- LISTA DE RODADAS ---------- */}
      {rounds.length === 0 ? (
        <p className="text-base-content/60 italic">Nenhuma rodada gerada ainda.</p>
      ) : (
        rounds.map((round, rIdx) => (
          <article key={rIdx} className="space-y-4 mt-10">
            {/* Título da rodada */}
            <h2 className="text-xl font-bold border-l-4 border-primary pl-3">Rodada {rIdx + 1}</h2>

            {/* Grid de partidas desta rodada */}
            <ol className="grid gap-6" style={gridTemplate(courts)}>
              {round.matches.map((match, mIdx) => (
                <li key={mIdx} className="card bg-base-200 shadow-lg rounded-2xl">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start gap-4">
                      {/* Equipes A e B */}
                      <TeamView title="Equipe A" team={match.teamA} />
                      <span className="self-center text-lg font-bold opacity-70">vs</span>
                      <TeamView title="Equipe B" team={match.teamB} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        ))
      )}

      {/* ---------- SCOREBOARD ---------- */}
      {matchCounts.size > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Placar</h2>
          {[...matchCounts.entries()]
            .sort(([, a], [, b]) => b - a)
            .map(([id, count]) => {
              const player = players.find((p) => p.id === id)
              if (!player) return null
              return (
                <div key={id} className="space-y-1">
                  <div className="flex justify-between text-sm font-medium">
                    <span>{player.name}</span>
                    <span>{count}</span>
                  </div>
                  <progress className="progress progress-primary w-full h-2" value={count} max={maxMatches} />
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// TeamView – componente presentational (stateless)
// ---------------------------------------------------------------------------
const TeamView: React.FC<{ title: string; team: Player[] }> = ({ title, team }) => (
  <div className="space-y-1">
    <h3 className="font-medium text-lg opacity-75 mb-1">{title}</h3>
    <ul className="space-y-1">
      {team.map((p) => (
        <li key={p.id} className="flex items-end gap-1 text-md">
          {p.name}
          <span className="text-sm text-secondary">Lv {p.level}</span>
        </li>
      ))}
    </ul>
  </div>
)

export default MatchesTab

// ---------------------------------------------------------------------------
// Estatísticas de participação por jogador
// ---------------------------------------------------------------------------
function countMatches(playersMatches: Match[]): Map<Player['id'], number> {
  const counts = new Map<Player['id'], number>()

  for (const { teamA, teamB } of playersMatches) {
    for (const p of [...teamA, ...teamB]) {
      counts.set(p.id, (counts.get(p.id) ?? 0) + 1)
    }
  }

  return counts
}

function printMatchCounts(playersMatches: Match[]): void {
  const counts = countMatches(playersMatches)
  console.log('Partidas jogadas por jogador:')
  ;[...counts.entries()]
    .sort(([, a], [, b]) => b - a)
    .forEach(([id, n]) => console.log(`• Jogador ${id}: ${n} partida(s)`))
}
