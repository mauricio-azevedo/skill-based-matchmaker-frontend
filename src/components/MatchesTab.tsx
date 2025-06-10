import React, { useState, useEffect, useMemo } from 'react'
import { usePlayers } from '../context/PlayersContext'
import { generateSchedule } from '../lib/algorithm'
import { toast, Toaster } from 'react-hot-toast'
import type { Player, Round } from '../types/players'

// Constants
const PLAYERS_PER_MATCH = 4 as const
const STORAGE_KEY_COURTS = 'match_courts'
const STORAGE_KEY_ROUNDS = 'match_rounds'

// Custom hook for syncing state with localStorage
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : initialValue
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

// Hook: count matches per player across all rounds
function useMatchCounts(rounds: Round[]): Map<string, number> {
  return useMemo(() => {
    const counts = new Map<string, number>()
    rounds.forEach((round) => {
      round.matches.forEach((match) => {
        const participants = [...match.teamA, ...match.teamB]
        participants.forEach((player) => {
          counts.set(player.id, (counts.get(player.id) || 0) + 1)
        })
      })
    })
    return counts
  }, [rounds])
}

// Hook: count how many times each pair of players has teamed up
function usePartnerCounts(rounds: Round[], players: Player[]): Map<string, Map<string, number>> {
  return useMemo(() => {
    // Initialize nested map: playerId -> (partnerId -> times teamed)
    const counts = new Map<string, Map<string, number>>()
    players.forEach((p) => {
      const inner = new Map<string, number>()
      players.forEach((q) => {
        if (p.id !== q.id) inner.set(q.id, 0)
      })
      counts.set(p.id, inner)
    })

    // Tally partnerships from past rounds
    rounds.forEach((round) => {
      round.matches.forEach((match) => {
        ;[match.teamA, match.teamB].forEach((team) => {
          const [p1, p2] = team
          const map1 = counts.get(p1.id)!
          const map2 = counts.get(p2.id)!
          map1.set(p2.id, (map1.get(p2.id) || 0) + 1)
          map2.set(p1.id, (map2.get(p1.id) || 0) + 1)
        })
      })
    })

    // For debugging: output as a table in console
    const debugObj: Record<string, Record<string, number>> = {}
    counts.forEach((innerMap, id) => {
      debugObj[id] = {}
      innerMap.forEach((count, partnerId) => {
        debugObj[id][partnerId] = count
      })
    })
    console.table(debugObj)

    return counts
  }, [rounds, players])
}

// Helper: CSS grid template style for given number of courts
const gridTemplate = (courts: number) => ({ gridTemplateColumns: `repeat(${courts}, minmax(0, 1fr))` })

// Main component: displays controls and list of rounds
const MatchesTab: React.FC = () => {
  const { players } = usePlayers()

  // State: number of courts and past rounds (both synced with localStorage)
  const [courts, setCourts] = useLocalStorage<number>(STORAGE_KEY_COURTS, 2)
  const [rounds, setRounds] = useLocalStorage<Round[]>(STORAGE_KEY_ROUNDS, [])

  // Compute helper maps for scheduling algorithm
  const matchCounts = useMatchCounts(rounds)
  const partnerCounts = usePartnerCounts(rounds, players)

  // Generate a new round when user clicks "Gerar"
  const handleGenerate = () => {
    try {
      const newRound = generateSchedule(players, courts, matchCounts, partnerCounts)
      setRounds((prev) => [...prev, newRound])
      toast.success('Rodada gerada e salva!', { duration: 3000 })
    } catch (error) {
      toast.error((error as Error).message, { duration: 6000 })
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Notification container */}
      <Toaster position="top-right" />

      {/* Controls: number of courts and generate button */}
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
          onClick={handleGenerate}
          disabled={players.length < PLAYERS_PER_MATCH}
        >
          Gerar
        </button>
      </div>

      {/* List of generated rounds */}
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

// Sub-component: displays a team with player names and levels
interface TeamViewProps {
  title: string
  team: Player[]
}

const TeamView: React.FC<TeamViewProps> = ({ title, team }) => (
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
