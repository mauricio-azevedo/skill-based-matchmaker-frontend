// src/components/MatchesTab.tsx
import React, { useState, useEffect } from 'react'
import { usePlayers } from '../context/PlayersContext'
import { generateSchedule } from '../lib/algorithm'
import { toast, Toaster } from 'react-hot-toast'
import type { Player, Round } from '../types/players'

const PLAYERS_PER_MATCH = 4 as const
const STORAGE_KEY_COURTS = 'match_courts'
const STORAGE_KEY_ROUNDS = 'match_rounds'

const gridTemplate = (courts: number) => ({ gridTemplateColumns: `repeat(${courts}, minmax(0, 1fr))` })

const MatchesTab: React.FC = () => {
  const { players } = usePlayers()

  // quadras
  const [courts, setCourts] = useState<number>(() => {
    const raw = localStorage.getItem(STORAGE_KEY_COURTS)
    return raw ? Number(raw) : 2
  })

  // rounds persistidos
  const [rounds, setRounds] = useState<Round[]>(() => {
    const raw = localStorage.getItem(STORAGE_KEY_ROUNDS)
    return raw ? JSON.parse(raw) : []
  })

  // atualizar quadras no localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_COURTS, String(courts))
  }, [courts])

  // persistir rounds
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_ROUNDS, JSON.stringify(rounds))
  }, [rounds])

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

  const generate = () => {
    try {
      const newRound = generateSchedule(players, courts, matchCounts)
      setRounds((prev) => [...prev, newRound])
      toast.success('Rodada gerada e salva!', { duration: 3000 })
    } catch (err) {
      toast.error((err as Error).message, { duration: 6000 })
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <Toaster position="top-right" />

      {/* CONTROLES */}
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

      {/* LISTA DE RODADAS */}
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
