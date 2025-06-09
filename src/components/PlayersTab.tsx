import React, { useState } from 'react'
import { usePlayers } from '../context/PlayersContext'

const PlayersTab: React.FC = () => {
  const { players, add, remove } = usePlayers()
  const [name, setName] = useState('')
  const [level, setLevel] = useState(1)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    add(name.trim(), level)
    setName('')
  }

  return (
    <div className="p-4 space-y-6 max-w-md mx-auto">
      <form onSubmit={submit} className="space-y-2">
        <input
          type="text"
          placeholder="Player name"
          className="input input-bordered w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="number"
          min={1}
          max={10}
          className="input input-bordered w-full"
          value={level}
          onChange={(e) => setLevel(Number(e.target.value))}
        />
        <button className="btn btn-primary w-full" type="submit">
          Add player
        </button>
      </form>

      <ul className="space-y-2">
        {players.map((p) => (
          <li key={p.id} className="flex justify-between items-center p-2 border rounded">
            <span>
              {p.name} <span className="badge badge-secondary ml-2">Lv {p.level}</span>
            </span>
            <button className="btn btn-sm btn-error" onClick={() => remove(p.id)}>
              ✕
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default PlayersTab
