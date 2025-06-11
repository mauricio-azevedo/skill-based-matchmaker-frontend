// MatchesTab.tsx
// Component responsible for generating and displaying balanced match rounds.

import React, { useState, useEffect } from 'react'
import { usePlayers } from '../context/PlayersContext'
import { generateSchedule } from '../lib/algorithm'
import { toast, Toaster } from 'react-hot-toast'
import type { Player } from '../types/players'
import { useRounds } from '../context/RoundsContext'

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------
// Number of participants required for a single match
const PLAYERS_PER_MATCH = 4 as const
// Keys to persist data in localStorage
const STORAGE_KEY_COURTS = 'match_courts'

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
// Utility: CSS grid template for displaying matches
// -----------------------------------------------------------------------------
const gridTemplate = (courts: number) => ({ gridTemplateColumns: `repeat(${courts}, minmax(0, 1fr))` })

// -----------------------------------------------------------------------------
// Main component: MatchesTab
// -----------------------------------------------------------------------------
const MatchesTab: React.FC = () => {
  const { players, updatePlayers } = usePlayers()
  const { rounds, addRound, setGames, clear } = useRounds()
  // só considera jogadores ativos na geração de rodada
  const activePlayers = players.filter((p) => p.active)

  // Persisted state from localStorage:
  const [courts, setCourts] = useLocalStorage<number>(STORAGE_KEY_COURTS, 2)

  /**
   * Handler for "Gerar" button click:
   * - Generates a new balanced round using counts.
   * - Persists the new round and shows a success toast.
   */
  const handleGenerate = () => {
    try {
      // 1) Gera rodada balanceada
      const newRound = generateSchedule(activePlayers, courts)
      addRound(newRound)

      // 2) Atualiza matchCount e partnerCounts de cada player
      updatePlayers((prev) => {
        const updated = prev.map((player) => {
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
        })

        // 3) Log do número de partidas de cada jogador (apenas números)
        console.log(
          'Número de partidas por jogador após geração:',
          updated.map((p) => {
            return {
              name: p.name,
              count: p.matchCount,
            }
          }),
        )

        return updated
      })

      toast.success('Rodada gerada e estatísticas atualizadas!', { duration: 3000 })
    } catch (error) {
      toast.error((error as Error).message, { duration: 6000 })
    }
  }

  const handleClear = () => {
    // Remove todas as rodadas
    clear()
    // Reseta estatísticas de cada jogador, mantendo-os no estado
    updatePlayers((prev) =>
      prev.map((player) => ({
        ...player,
        matchCount: 0,
        partnerCounts: {},
      })),
    )
    toast.success('Rodadas e estatísticas reiniciadas!', { duration: 3000 })
  }

  type ScoreInputProps = {
    value: number | null
    onChange: (v: number | null) => void
  }
  const ScoreInput: React.FC<ScoreInputProps> = ({ value, onChange }) => (
    <input
      type="number"
      min={0}
      className="input input-xs w-16 text-center"
      value={value ?? ''}
      onChange={(e) => {
        const v = e.target.value
        onChange(v === '' ? null : Number(v))
      }}
    />
  )

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      {/* Notification container */}
      <Toaster position="top-right" />

      {/* Controls: number of courts selector, generate and clear buttons */}
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
        <button className="btn btn-secondary rounded-full" onClick={handleClear} disabled={rounds.length === 0}>
          Limpar
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
                  {/* Times + placar */}
                  <div className="grid grid-cols-[1fr_auto_1fr] gap-4 items-center">
                    {/* Team A  */}
                    <div className={m.winner === 'A' ? 'ring ring-success rounded-lg p-1' : ''}>
                      <TeamView title="Equipe A" team={m.teamA} />
                    </div>

                    {/* Placar */}
                    <div className="flex flex-col items-center gap-1">
                      <ScoreInput value={m.gamesA} onChange={(v) => setGames(idx, m.id, 'A', v)} />
                      <span className="font-bold">×</span>
                      <ScoreInput value={m.gamesB} onChange={(v) => setGames(idx, m.id, 'B', v)} />
                    </div>

                    {/* Team B  */}
                    <div className={m.winner === 'B' ? 'ring ring-success rounded-lg p-1' : ''}>
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
