import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { usePlayers } from '@/context/PlayersContext'
import { seedPlayers } from '@/data/seedPlayers'
import { shuffle } from '@/utils/shuffle'
import PlayerModal from './PlayerModal'
import { Edit, Users } from 'lucide-react'
import { itemVariants } from '@/consts/animation'
import { getLevelLabel } from '@/consts/levels'
import { type SortBy, usePlayerSort } from '@/hooks/usePlayerSort'
import PlayerSortDropdown from '@/components/PlayerSortDropdown'
import { Separator } from '@/components/ui/separator'
import { useVersionGuard } from '@/hooks/useVersionGuard'

export function PlayersTab() {
  const { performVersionCleanup } = useVersionGuard()
  const { players, toggleActive, add } = usePlayers()

  // Verifica se os seedPlayers já estão carregados
  const isSeedLoaded = useMemo(() => {
    if (players.length !== seedPlayers.length) return false
    const seedSet = new Set(seedPlayers.map(({ name, level }) => `${name}-${level}`))
    return players.every(({ name, level }) => seedSet.has(`${name}-${level}`))
  }, [players])

  const [sortBy, setSortBy] = useState<SortBy>('active')
  const sortedPlayers = usePlayerSort(players, sortBy)

  const activeCount = players.filter((p) => p.active).length
  const total = players.length
  const plural = activeCount === 1 ? 'ativo' : 'ativos'

  const handleLoadSeed = () => {
    performVersionCleanup()

    const seeds = [...seedPlayers]
    shuffle(seeds)
    seeds.forEach(({ id, name, level, preferredPairs = [] }) => {
      add(name, level, preferredPairs, id)
    })
  }

  return (
    <div className="w-full h-full flex flex-col relative">
      <h2 className="text-lg font-semibold leading-tight m-0 text-center">Jogadores</h2>
      <Separator className="mt-2 mb-0" />

      {players.length === 0 ? (
        <div className="pl-4 h-full flex items-center justify-center pr-4">
          <p className="text-sm text-muted-foreground relative">
            Nenhum jogador adicionado ainda.
            <Button
              size="sm"
              variant="secondary"
              className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2"
              disabled={isSeedLoaded}
              onClick={() => handleLoadSeed()}
            >
              Inicializar pré-definidos
            </Button>
          </p>
        </div>
      ) : (
        <>
          {/* Lista existente de jogadores */}
          <div className="pt-4 overflow-hidden flex flex-col h-full">
            <div className="flex items-center justify-between h-8 px-4">
              <PlayerSortDropdown sortBy={sortBy} setSortBy={setSortBy} />
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
            </div>
            <div className="flex w-full flex-col gap-3 flex-1 overflow-auto px-4 pb-16">
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
                    <div className="flex-1 flex items-center justify-between rounded-lg border px-3 py-2">
                      <div className="flex items-center gap-4">
                        <p className="font-medium text-sm">{p.name}</p>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {getLevelLabel(p.level)}
                        </Badge>
                      </div>
                      <Switch id={`active-${p.id}`} checked={p.active} onCheckedChange={() => toggleActive(p.id)} />
                    </div>
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
            </div>
          </div>
        </>
      )}

      {/* Botão de adicionar */}
      <PlayerModal
        mode="add"
        trigger={
          <div className="absolute bottom-4 right-4 shadow-2xl">
            <Button size="sm">Adicionar jogador</Button>
          </div>
        }
      />
    </div>
  )
}
