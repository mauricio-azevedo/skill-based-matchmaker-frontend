// MatchesTab.tsx
// Component responsible for generating and displaying balanced match rounds.

import React, { useState, useEffect, useMemo } from 'react'
import { usePlayers } from '../context/PlayersContext'
import { generateSchedule } from '../lib/algorithm'
import { toast, Toaster } from 'react-hot-toast'
import type { Player, Round } from '../types/players'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
// Number of participants required for a single match
const PLAYERS_PER_MATCH = 4 as const
// Keys to persist data in localStorage
const STORAGE_KEY_COURTS = 'match_courts'
const STORAGE_KEY_ROUNDS = 'match_rounds'

// -----------------------------------------------------------------------------
// Hook: useLocalStorage
// -----------------------------------------------------------------------------
/**
 * Custom hook that syncs React state with localStorage.
 * @param key localStorage key
 * @param initialValue value to use if no entry exists
 * @returns current value and setter function
 */
function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  // Initialize state from localStorage on first render
  const [value, setValue] = useState<T>(() => {
    const stored = localStorage.getItem(key)
    return stored ? (JSON.parse(stored) as T) : initialValue
  })

  // Write back to localStorage whenever the state changes
  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

// -----------------------------------------------------------------------------
// Hook: useMatchCounts
// -----------------------------------------------------------------------------
/**
 * Computes how many matches each player has actually played across all stored rounds.
 */
function useMatchCounts(rounds: Round[]): Map<string, number> {
  return useMemo(() => {
    const counts = new Map<string, number>()

    // Tally one count per match participation
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

// -----------------------------------------------------------------------------
// Hook: usePartnerCounts
// -----------------------------------------------------------------------------
/**
 * Tallies how often each pair of players has teamed up in past rounds.
 * This supports the algorithm's partner-frequency penalty.
 */
function usePartnerCounts(rounds: Round[], players: Player[]): Map<string, Map<string, number>> {
  return useMemo(() => {
    const counts = new Map<string, Map<string, number>>()

    // Initialize nested map with zeros
    players.forEach((p) => {
      const inner = new Map<string, number>()
      players.forEach((q) => {
        if (p.id !== q.id) inner.set(q.id, 0)
      })
      counts.set(p.id, inner)
    })

    // Increment for each historical partnership
    rounds.forEach((round) => {
      round.matches.forEach((match) => {
        ;[match.teamA, match.teamB].forEach((team) => {
          const [p1, p2] = team
          counts.get(p1.id)!.set(p2.id, (counts.get(p1.id)!.get(p2.id) || 0) + 1)
          counts.get(p2.id)!.set(p1.id, (counts.get(p2.id)!.get(p1.id) || 0) + 1)
        })
      })
    })

    return counts
  }, [rounds, players])
}

// -----------------------------------------------------------------------------
// Utility: CSS grid template for displaying matches
// -----------------------------------------------------------------------------
const gridTemplate = (courts: number) => ({ gridTemplateColumns: `repeat(${courts}, minmax(0, 1fr))` })

// -----------------------------------------------------------------------------
// Main component: MatchesTab
// -----------------------------------------------------------------------------
const MatchesTab: React.FC = () => {
  const { players, updatePlayers } = usePlayers()
  // só considera jogadores ativos na geração de rodada
  const activePlayers = players.filter((p) => p.active)

  // Persisted state from localStorage:
  const [courts, setCourts] = useLocalStorage<number>(STORAGE_KEY_COURTS, 2)
  const [rounds, setRounds] = useLocalStorage<Round[]>(STORAGE_KEY_ROUNDS, [])

  // Compute both real and algorithm-adjusted match counts
  const matchCounts = useMatchCounts(rounds)
  const partnerCounts = usePartnerCounts(rounds, players)

  // Debugging: print sorted entries to verify both maps match when expected
  useEffect(() => {
    // Helper to sort map entries by player ID
    const sortEntries = (map: Map<string, number>) => Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b))

    // Log matchCounts as sorted array
    console.log('matchCounts:', sortEntries(matchCounts))

    // Build a plain object of objects for partnerCounts
    const tableData: Record<string, Record<string, number>> = {}
    partnerCounts.forEach((innerMap, playerId) => {
      tableData[playerId] = {}
      Array.from(innerMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([partnerId, count]) => {
          tableData[playerId][partnerId] = count
        })
    })

    // Dump partnerCounts to the console as a table for easy inspection
    console.table(tableData)
  }, [matchCounts, partnerCounts])

  /**
   * Handler for "Gerar" button click:
   * - Generates a new balanced round using counts.
   * - Persists the new round and shows a success toast.
   */
  const handleGenerate = () => {
    try {
      // 1) Gera rodada balanceada
      const newRound = generateSchedule(activePlayers, courts)
      setRounds((prev) => [...prev, newRound])

      // 2) Atualiza matchCount e partnerCounts de cada player
      updatePlayers((prev) =>
        prev.map((player) => {
          let addedMatches = 0
          const updatedPartners = { ...player.partnerCounts }

          newRound.matches.forEach(({ teamA, teamB }) => {
            // equipe A
            const [a1, a2] = teamA
            if (player.id === a1.id || player.id === a2.id) {
              addedMatches++
              const partnerId = player.id === a1.id ? a2.id : a1.id
              updatedPartners[partnerId] = (updatedPartners[partnerId] || 0) + 1
            }
            // equipe B
            const [b1, b2] = teamB
            if (player.id === b1.id || player.id === b2.id) {
              addedMatches++
              const partnerId = player.id === b1.id ? b2.id : b1.id
              updatedPartners[partnerId] = (updatedPartners[partnerId] || 0) + 1
            }
          })

          return {
            ...player,
            matchCount: player.matchCount + addedMatches,
            partnerCounts: updatedPartners,
          }
        }),
      )

      toast.success('Rodada gerada e estatísticas atualizadas!', { duration: 3000 })
    } catch (error) {
      toast.error((error as Error).message, { duration: 6000 })
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Notification container */}
      <Toaster position="top-right" />

      {/* Controls: number of courts selector and generate button */}
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

      {/* Display list of generated rounds or placeholder text */}
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

// -----------------------------------------------------------------------------
// Sub-component: TeamView
// -----------------------------------------------------------------------------
/**
 * Displays a team's players and their levels in a simple list.
 */
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
          {/* Player name and level badge */}
          {p.name} <span className="text-sm text-secondary">Lv {p.level}</span>
        </li>
      ))}
    </ul>
  </div>
)

export default MatchesTab
