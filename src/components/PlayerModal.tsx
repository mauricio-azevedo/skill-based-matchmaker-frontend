import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

import { Check, ChevronsUpDown, Trash } from 'lucide-react'
import { cn } from '@/lib/utils'
import { LEVELS } from '@/consts/levels'
import { usePlayers } from '@/context/PlayersContext'
import React, { type FC, type ReactNode, useCallback, useEffect, useState } from 'react'
import { singleToastSuccess } from '@/utils/singleToast'
import type { Player } from '@/types/players'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Switch } from '@/components/ui/switch'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command'

type Mode = 'add' | 'edit'

interface PlayerModalProps {
  mode: Mode
  trigger: ReactNode
  player?: Player // obrigatório no modo 'edit'
}

const PlayerModal: FC<PlayerModalProps> = ({ mode, trigger, player }) => {
  const { players, add, updatePlayers, remove } = usePlayers()

  const nameInputRef = React.useRef<HTMLInputElement>(null)

  // ----------------------- estado local -----------------------
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(player?.name ?? '')
  const [level, setLevel] = useState((player?.level ?? 1).toString())
  const [active, setActive] = useState(player?.active ?? true)
  const [preferredPairs, setPreferredPairs] = useState<string[]>(player?.preferredPairs ?? [])

  // (re)sinc quando abrir outro player
  const resetForm = useCallback(() => {
    setName(player?.name ?? '')
    setLevel((player?.level ?? 1).toString())
    setActive(player?.active ?? true)
    setPreferredPairs(player?.preferredPairs ?? [])
  }, [player])

  useEffect(() => {
    resetForm()
  }, [player, resetForm])

  // ----------------------- helpers -----------------------
  const selectablePlayers = players.filter((p) => p.id !== player?.id && p.active)
  const togglePair = (id: string) =>
    setPreferredPairs((prev) => (prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]))

  // ----------------------- ações -----------------------
  const handleSave = () => {
    if (!name.trim()) return

    if (mode === 'add') {
      add(name.trim(), Number(level), preferredPairs)
      singleToastSuccess(`${name.trim()} adicionado!`, { position: 'top-center', duration: 1000 })
      resetForm()
      nameInputRef.current?.focus()
      return
    }

    // modo edit
    updatePlayers((plrs) =>
      plrs.map((p) =>
        p.id === player!.id ? { ...p, name: name.trim() || p.name, level: Number(level), active, preferredPairs } : p,
      ),
    )
    setOpen(false)
  }

  const handleDelete = () => remove(player!.id)

  // ----------------------- UI -----------------------
  const title = mode === 'add' ? 'Novo jogador' : 'Editar jogador'

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) resetForm()
        setOpen(o)
      }}
    >
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {trigger}
      </DialogTrigger>

      <DialogContent className="top-2 translate-y-2" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {mode === 'edit' && <DialogDescription>{player!.name}</DialogDescription>}
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Nome */}
          <div className="grid gap-3">
            <Label htmlFor="player-name">Nome</Label>
            <Input
              id="player-name"
              ref={nameInputRef}
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              autoFocus
            />
          </div>

          {/* Nível */}
          <div className="grid gap-3">
            <Label htmlFor="player-level">Nível</Label>
            <ToggleGroup
              id="player-level"
              type="single"
              value={level}
              onValueChange={(val: string) => val && setLevel(val)}
              className="flex flex-wrap gap-2 w-full"
            >
              {LEVELS.map(({ value, label }) => (
                <ToggleGroupItem key={value} value={value.toString()} className="w-8 justify-center">
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Ativo? (somente edição) */}
          {mode === 'edit' && (
            <div className="flex items-center gap-2">
              <Label htmlFor="edit-active" className="text-sm">
                Ativo
              </Label>
              <Switch id="edit-active" checked={active} onCheckedChange={setActive} />
            </div>
          )}

          {/* Duplas preferidas */}
          <div className="grid gap-3">
            <Label>Duplas preferidas</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn('w-full justify-between', preferredPairs.length === 0 && 'text-muted-foreground')}
                >
                  {preferredPairs.length ? (
                    <div className="flex gap-1 flex-wrap max-w-[85%] overflow-hidden">
                      {preferredPairs.map((id) => {
                        const pl = players.find((p) => p.id === id)
                        return (
                          <Badge key={id} variant="secondary" className="truncate">
                            {pl?.name ?? 'Desconhecido'}
                          </Badge>
                        )
                      })}
                    </div>
                  ) : (
                    'Selecionar parceiros…'
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Buscar jogador…" />
                  <CommandEmpty>Nenhum jogador encontrado.</CommandEmpty>
                  <CommandGroup>
                    {selectablePlayers.map((pl) => {
                      const isSelected = preferredPairs.includes(pl.id)
                      return (
                        <CommandItem key={pl.id} onSelect={() => togglePair(pl.id)}>
                          <Check className={cn('mr-2 h-4 w-4', isSelected ? 'opacity-100' : 'opacity-0')} />
                          {pl.name}
                        </CommandItem>
                      )
                    })}
                  </CommandGroup>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <DialogFooter className="flex-row justify-between">
          {mode === 'edit' && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" aria-label={`Remover ${player!.name}`}>
                  <Trash className="text-destructive" size={16} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja remover <strong>{player!.name}</strong>?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction className="bg-transparent p-0 hover:bg-transparent">
                    <Button variant="destructive" className="w-full" onClick={handleDelete}>
                      Excluir
                    </Button>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          <div className="flex gap-2 ml-auto">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            {mode === 'edit' ? (
              <DialogClose asChild>
                <Button onClick={handleSave}>Salvar</Button>
              </DialogClose>
            ) : (
              <Button onClick={handleSave}>Salvar</Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PlayerModal
