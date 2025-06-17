import { useState, type FC, type FormEvent, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { usePlayers } from '@/context/PlayersContext'
import EditPlayerModal from './EditPlayerModal'
import { Plus, Minus, Users, HelpCircle } from 'lucide-react'
import { useCourts } from '@/context/CourtsContext'
import { itemVariants } from '@/consts/animation'
import { singleToastSuccess } from '@/utils/singleToast'
import { getLevelLabel, LEVELS, LEVEL_DESCRIPTIONS } from '@/consts/levels'
import React from 'react'

const PlayersTab: FC = () => {
  const { players, add, toggleActive } = usePlayers()
  const { courts, setCourts } = useCourts()

  const [name, setName] = useState('')
  const [level, setLevel] = useState(1)

  const nameInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    add(trimmed, level)
    singleToastSuccess(`${trimmed} adicionado!`, { position: 'bottom-center', duration: 1000 })
    setName('')
    queueMicrotask(() => nameInputRef.current?.focus())
  }

  const activeCount = players.filter((p) => p.active).length
  const total = players.length
  const plural = activeCount === 1 ? 'ativo' : 'ativos'

  return (
    <Card>
      <CardHeader>
        <CardTitle>Setup</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col justify-between !gap-0">
        {/* Número de quadras */}
        <div className="flex items-center gap-2 mb-3">
          <Label htmlFor="court-count">Número de quadras</Label>
          <div className="flex items-center gap-1">
            {/* Botão de diminuir */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onMouseDown={(e) => e.preventDefault()} // mantém o foco atual
              onClick={() => setCourts((prev) => Math.max(1, prev - 1))}
              aria-label="Diminuir número de quadras"
              className="h-8 text-xs"
            >
              <Minus className="h-4 w-4" />
            </Button>

            {/* Campo numérico (também permite digitação direta) */}
            <Input
              id="court-count"
              type="number"
              min={1}
              value={courts}
              onChange={(e) => setCourts(Math.max(1, Number(e.target.value)))}
              readOnly
              tabIndex={-1}
              className="w-12 text-center cursor-default select-none pointer-events-none text-xs h-8"
            />

            {/* Botão de aumentar */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onMouseDown={(e) => e.preventDefault()} // mantém o foco atual
              onClick={() => setCourts((prev) => prev + 1)}
              aria-label="Aumentar número de quadras"
              className="h-8 text-xs"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Título Jogadores e contador */}
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Jogadores</h2>
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

        {/* Lista de jogadores */}
        {players.length === 0 ? (
          <p className="italic text-muted-foreground flex-1">Adicione pelo menos 4 jogadores.</p>
        ) : (
          <ul className="flex flex-col gap-3 flex-1 overflow-y-auto">
            <AnimatePresence initial={false}>
              {players.map((p) => (
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

        {/* Formulário de adição */}
        <form onSubmit={handleSubmit} className="flex gap-2 items-center pt-4">
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex gap-2 flex-1">
              <Label htmlFor="player-name" className="w-[3.25rem]">
                Nome
              </Label>
              <Input
                className="flex-1"
                ref={nameInputRef}
                id="player-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="flex gap-2 flex-1">
              {/* Dialog de ajuda sobre níveis */}
              <Dialog>
                {/* ----------- Trigger --------------- */}
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

                {/* ----------- Content (fora do Trigger!) --------------- */}
                <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
                  <DialogHeader>
                    <DialogTitle>Descrição dos níveis</DialogTitle>
                  </DialogHeader>

                  <div className="text-xs leading-snug min-h-0 h-120 overflow-y-auto">
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
                      , que descreve os estágios C → AA usados em camps e treinos internacionais. Embora cada academia
                      possa adaptar rótulos, essa matriz é amplamente adotada e serve como checklist para autoavaliação.
                    </p>
                  </div>

                  <DialogFooter>
                    {/* Botão de fechar funciona porque agora está fora do trigger */}
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        OK, voltar
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              {/* Outros controles */}
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
                    onClick={() => {
                      setLevel(value)
                      queueMicrotask(() => nameInputRef.current?.focus())
                    }}
                  >
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>

          <Button
            size="icon"
            className="rounded-full"
            onMouseDown={(e) => e.preventDefault()} // ★ don't steal focus
            type="submit"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default PlayersTab
