import React, { type FC, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { usePlayers } from '@/context/PlayersContext'
import PlayerModal from './PlayerModal'
import { Edit, Plus, Users } from 'lucide-react'
import { itemVariants } from '@/consts/animation'
import { getLevelLabel } from '@/consts/levels'
import { type SortBy, usePlayerSort } from '@/hooks/usePlayerSort'
import PlayerSortDropdown from '@/components/PlayerSortDropdown'

const PlayersTab: FC = () => {
  const { players, toggleActive } = usePlayers()

  const [sortBy, setSortBy] = useState<SortBy>('active')
  const sortedPlayers = usePlayerSort(players, sortBy)

  const activeCount = players.filter((p) => p.active).length
  const total = players.length
  const plural = activeCount === 1 ? 'ativo' : 'ativos'

  return (
    <React.Fragment>
      {/* Header */}
      <div className="flex w-full items-center justify-between h-8 pr-4 mb-2">
        <PlayerSortDropdown sortBy={sortBy} setSortBy={setSortBy} />

        <div className="flex items-center gap-3">
          {/* Contador de jogadores ativos */}
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm">
              {activeCount === total ? (
                `${total}`
              ) : (
                <>
                  {activeCount} {plural} <span className="text-muted-foreground">/ {total}</span>
                </>
              )}
            </span>
          </div>

          {/* Botão que abre o dialog de adição */}
          <PlayerModal
            mode="add"
            trigger={
              <Button className="h-8 w-8" size="icon" variant="default" aria-label="Adicionar jogador">
                <Plus className="h-4 w-4" />
              </Button>
            }
          />
        </div>
      </div>

      {/* Lista de jogadores */}
      {players.length === 0 ? (
        <p className="italic text-muted-foreground flex-1 w-full">Adicione pelo menos 4 jogadores.</p>
      ) : (
        <ul className="flex w-full flex-col gap-3 flex-1 overflow-y-auto pr-4">
          <AnimatePresence initial={false}>
            {sortedPlayers.map((p) => (
              <motion.li
                key={p.id}
                layout="position"
                variants={itemVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex items-center gap-1"
              >
                {/* cartão interno */}
                <div className="flex-1 flex items-center justify-between rounded-lg border px-3 py-2">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center">
                      <p className="font-medium text-sm">{p.name}</p>
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {getLevelLabel(p.level)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch id={`active-${p.id}`} checked={p.active} onCheckedChange={() => toggleActive(p.id)} />
                  </div>
                </div>

                {/* trigger do modal de edição */}
                <PlayerModal
                  mode="edit"
                  player={p}
                  trigger={
                    <Button className="h-8 w-8" variant="ghost" size="icon" aria-label={`Editar ${p.name}`}>
                      <Edit size={16} />
                    </Button>
                  }
                />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </React.Fragment>
  )
}

export default PlayersTab
