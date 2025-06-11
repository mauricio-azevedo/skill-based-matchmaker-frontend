import { useState } from 'react'
import * as React from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { usePlayers } from '@/context/PlayersContext'

/**
 * Player manager — animação FLIP robusta
 * -------------------------------------------------------------
 * • Usa layout FLIP em UL + LI (layout="position") — reposiciona
 *   os itens com spring suave, sem travar quando remove no meio.
 * • Troquei space-y por flex+gap: evita colapso de margin e resolve
 *   glitch de collapse/expand no meio da lista.
 * • Entrada: fade + slide + scale; saída: shrink + fade.
 */

// Variantes de item
const itemVariants = {
  initial: { opacity: 0, scale: 0.9, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.8 },
}

const spring = { type: 'spring', stiffness: 500, damping: 38, mass: 0.9 }

const PlayersTab: React.FC = () => {
  const { players, add, remove, toggleActive } = usePlayers()
  const [name, setName] = useState('')
  const [level, setLevel] = useState(1)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    add(name.trim(), level)
    setName('')
  }

  return (
    <section className="mx-auto max-w-md px-4 py-8 space-y-8 flex flex-col h-full">
      <div className="card bg-base-100 shadow-xl min-h-0">
        <div className="card-body space-y-6 p-6 overflow-hidden">
          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <input
                aria-label="Player name"
                type="text"
                placeholder="Player name"
                className="input input-bordered w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="form-control">
              <input
                aria-label="Player level"
                type="number"
                min={1}
                max={10}
                className="input input-bordered w-full"
                value={level}
                onChange={(e) => setLevel(Number(e.target.value))}
              />
            </div>
            <button className="btn btn-primary w-full" type="submit">
              Add player
            </button>
          </form>

          <div className="divider m-0" />

          {/* Lista com FLIP */}
          <div className="rounds-scroll flex-1 overflow-y-auto overflow-x-hidden pr-1 space-y-10 mt-6 min-h-0">
            <LayoutGroup>
              <motion.ul layout className="flex flex-col gap-3" initial={false}>
                <AnimatePresence initial={false}>
                  {players.map((p) => (
                    <motion.li
                      key={p.id}
                      layout="position"
                      variants={itemVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={spring}
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between rounded-xl px-3 py-2 bg-base-100 hover:bg-base-200"
                    >
                      <div className="flex items-center gap-4">
                        <span className="font-medium">
                          {p.name}
                          <span className="badge badge-secondary ml-2">Lv {p.level}</span>
                        </span>

                        {/* Toggle ativo/inativo */}
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            className="toggle toggle-sm"
                            checked={p.active}
                            onChange={() => toggleActive(p.id)}
                          />
                          <span className="text-sm opacity-70">{p.active ? 'Ativo' : 'Inativo'}</span>
                        </label>
                      </div>

                      <button
                        aria-label={`Remove ${p.name}`}
                        className="btn btn-sm btn-ghost text-error"
                        onClick={() => remove(p.id)}
                      >
                        ✕
                      </button>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            </LayoutGroup>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PlayersTab
