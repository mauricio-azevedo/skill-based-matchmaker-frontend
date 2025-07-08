import React, { type FC, type FormEvent, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { usePlayers } from '@/context/PlayersContext'
import EditPlayerModal from './EditPlayerModal'
import { HelpCircle, Plus, Users } from 'lucide-react'
import { itemVariants } from '@/consts/animation'
import { singleToastSuccess } from '@/utils/singleToast'
import { getLevelLabel, LEVEL_DESCRIPTIONS, LEVELS } from '@/consts/levels'
import { type SortBy, usePlayerSort } from '@/hooks/usePlayerSort'
import PlayerSortDropdown from '@/components/PlayerSortDropdown'

const PlayersTab: FC = () => {
  const { players, add, toggleActive } = usePlayers()

  const [sortBy, setSortBy] = useState<SortBy>('active')
  const sortedPlayers = usePlayerSort(players, sortBy)

  const [name, setName] = useState('')
  const [level, setLevel] = useState(1)

  // Dialog open state for the add player form
  const [openAdd, setOpenAdd] = useState(false)

  const nameInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    add(trimmed, level)
    singleToastSuccess(`${trimmed} adicionado!`, { position: 'bottom-center', duration: 1000 })
    setName('')
    // setLevel(1)
    // setOpenAdd(false)
  }

  const activeCount = players.filter((p) => p.active).length
  const total = players.length
  const plural = activeCount === 1 ? 'ativo' : 'ativos'

  return (
    <React.Fragment>
      {/* Header */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-1">
          <CardTitle>Jogadores</CardTitle>
          <PlayerSortDropdown sortBy={sortBy} setSortBy={setSortBy} />
        </div>

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
          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button size="icon" className="rounded-full" variant="outline" aria-label="Adicionar jogador">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]" onOpenAutoFocus={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>Novo jogador</DialogTitle>
              </DialogHeader>

              {/* Formulário de adição */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <Label htmlFor="player-name" className="w-[3.25rem]">
                      Nome
                    </Label>
                    <Input
                      className="flex-1"
                      ref={nameInputRef}
                      id="player-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-2 items-center">
                    {/* Dialog de ajuda sobre níveis */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <Label htmlFor="player-level" className="w-[3.25rem] gap-1">
                          Nível
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label="Sobre os níveis"
                            className="h-3 w-3 p-0"
                            onMouseDown={(e) => e.preventDefault()}
                          >
                            <HelpCircle className="!h-3 !w-3" />
                          </Button>
                        </Label>
                      </DialogTrigger>

                      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                        <DialogHeader>
                          <DialogTitle>Descrição dos níveis</DialogTitle>
                        </DialogHeader>

                        <div className="text-xs leading-snug min-h-0 h-[calc(100dvh-17rem)] overflow-y-auto">
                          {LEVELS.map(({ value }) => (
                            <React.Fragment key={value}>
                              <div dangerouslySetInnerHTML={{ __html: LEVEL_DESCRIPTIONS[value] }} />
                              <br />
                              <br />
                            </React.Fragment>
                          ))}
                          <hr />
                          <br />
                          <p className="pt-2">
                            🔎 Fonte:{' '}
                            <a
                              href="https://kontrabeach.com/beach-tennis-levels/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline"
                            >
                              Kontra Beach Tennis – “Beach Tennis Skill Levels”
                            </a>
                            , que descreve os estágios C → AA usados em camps e treinos internacionais{' '}
                            <strong>(também adotado pelo Cordel para nivelamento de turmas)</strong>. Embora cada
                            academia possa adaptar rótulos, essa matriz é amplamente adotada e serve como checklist para
                            autoavaliação.
                          </p>
                        </div>

                        <DialogFooter>
                          <DialogClose asChild>
                            <Button type="button" variant="secondary">
                              OK, voltar
                            </Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    {/* ToggleGroup para escolher nível */}
                    <ToggleGroup
                      id="player-level"
                      type="single"
                      value={level.toString()}
                      onValueChange={(val: string) => val && setLevel(Number(val))}
                      className="flex flex-wrap gap-2 flex-1"
                    >
                      {LEVELS.map(({ value, label }) => (
                        <ToggleGroupItem
                          key={value}
                          value={value.toString()}
                          aria-label={`Nível ${value}`}
                          className="w-8 justify-center"
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={() => setLevel(value)}
                        >
                          {label}
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                </div>

                <Button type="submit" className="self-end">
                  Adicionar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Lista de jogadores */}
      {players.length === 0 ? (
        <p className="italic text-muted-foreground flex-1">Adicione pelo menos 4 jogadores.</p>
      ) : (
        <ul className="flex w-full flex-col gap-3 flex-1 overflow-y-auto mt-4">
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
                <EditPlayerModal player={p} />
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </React.Fragment>
  )
}

export default PlayersTab
