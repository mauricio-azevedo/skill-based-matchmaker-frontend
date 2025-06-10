// src/components/MatchesTab.tsx

import React, { useState, useEffect } from 'react'
import { usePlayers } from '../context/PlayersContext'
import { generateSchedule } from '../lib/algorithm'
import { toast, Toaster } from 'react-hot-toast'
import type { Player, Round } from '../types/players'

// constants
const PLAYERS_PER_MATCH = 4 as const
const STORAGE_KEY_COURTS = 'match_courts'
const STORAGE_KEY_ROUNDS = 'match_rounds'

// helper to create a responsive grid
const gridTemplate = (courts: number) => ({ gridTemplateColumns: `repeat(${courts}, minmax(0, 1fr))` })

const MatchesTab: React.FC = () => {
  const { players } = usePlayers()

  // number of courts (persisted)
  const [courts, setCourts] = useState<number>(() => {
    const raw = localStorage.getItem(STORAGE_KEY_COURTS)
    return raw ? Number(raw) : 2
  })

  // past rounds (persisted)
  const [rounds, setRounds] = useState<Round[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY_ROUNDS)
    return raw ? JSON.parse(raw) : []
  })

  // persist courts when changed
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COURTS, String(courts))
  }, [courts])

  // persist rounds when changed
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROUNDS, JSON.stringify(rounds))
  }, [rounds])

  // count how many matches each player has played
  const matchCounts = React.useMemo(() => {
    const counts = new Map<string, number>()
    for (const round of rounds) {
      for (const match of round.matches) {
        for (const p of [...match.teamA, ...match.teamB]) {
          counts.set(p.id, (counts.get(p.id) || 0) + 1)
        }
      }
    }
    return counts
  }, [rounds])

  // --- NEW: build a map of how many times each pair has teamed up ---
  const partnerCounts = React.useMemo(() => {
    // initialize a nested map: playerId -> (otherId -> times teamed)
    const counts = new Map<string, Map<string, number>>()
    players.forEach((p) => {
      const inner = new Map<string, number>()
      players.forEach((q) => {
        if (p.id !== q.id) {
          inner.set(q.id, 0)
        }
      })
      counts.set(p.id, inner)
    })

    // iterate through past rounds and increment each partnership
    for (const round of rounds) {
      for (const match of round.matches) {
        for (const team of [match.teamA, match.teamB] as Player[][]) {
          const [p1, p2] = team
          const map1 = counts.get(p1.id)!
          map1.set(p2.id, (map1.get(p2.id) || 0) + 1)
          const map2 = counts.get(p2.id)!
          map2.set(p1.id, (map2.get(p1.id) || 0) + 1)
        }
      }
    }

    // Converte Map<Map> em objeto simples: { [playerId]: { [otherId]: count } }
    const legibleCounts: Record<string, Record<string, number>> = {}
    counts.forEach((innerMap, playerId) => {
      // cria objeto para cada jogador
      legibleCounts[playerId] = {}
      innerMap.forEach((count, otherId) => {
        legibleCounts[playerId][otherId] = count
      })
    })

    // Log em formato de tabela (colunas = parceiros)
    console.table(legibleCounts)

    return counts
  }, [rounds, players])

  const generate = () => {
    try {
      // now include partnerCounts to help balance pairings over time
      const newRound = generateSchedule(players, courts, matchCounts, partnerCounts)
      setRounds((prev) => [...prev, newRound])
      toast.success('Rodada gerada e salva!', { duration: 3000 })
    } catch (err) {
      toast.error((err as Error).message, { duration: 6000 })
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <Toaster position="top-right" />

      {/* CONTROLS */}
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

      {/* ROUNDS LIST */}
      {rounds.length === 0 ? (
        <p className="text-base-content/60 italic">Nenhuma rodada gerada ainda.</p>
      ) : (
        rounds.map((round, idx) => (
          <article key={idx} className="space-y-4 mt-10">
            <h2 className="text-xl font-bold border-l-4 border-primary pl-3">Rodada {idx + 1}</h2>
            <ol className="grid gap-6" style={gridTemplate(courts)}>
              {round.matches.map((m, i) => (
                <li key={i} className="card bg-base-200 shadow-lg rounded-2xl">
                  <div className="card-body p-4">
                    <div className="flex justify-between items-start gap-4">
                      <TeamView title="Equipe A" team={m.teamA} />
                      <span className="self-center text-lg font-bold opacity-70">vs</span>
                      <TeamView title="Equipe B" team={m.teamB} />
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </article>
        ))
      )}
    </div>
  )
}

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
