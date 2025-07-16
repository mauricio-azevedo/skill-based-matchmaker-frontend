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
import { Trash } from 'lucide-react'
import { LEVELS } from '@/consts/levels'
import { usePlayers } from '@/context/PlayersContext'
import React, { type FC, type ReactNode, useCallback, useEffect, useState } from 'react'
import { singleToastSuccess } from '@/utils/singleToast'
import type { Player } from '@/types/entities'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ConfirmDialog'

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
  const [preferredPair, setPreferredPair] = useState<string>(player?.preferredPairs?.[0] ?? '')

  // estado para o ConfirmDialog
  const [confirmOpen, setConfirmOpen] = useState(false)

  // reset do formulário
  const resetForm = useCallback(() => {
    setName(player?.name ?? '')
    setLevel((player?.level ?? 1).toString())
    setActive(player?.active ?? true)
    setPreferredPair(player?.preferredPairs?.[0] ?? '')
  }, [player])

  useEffect(() => {
    resetForm()
  }, [player, resetForm])

  // ----------------------- helpers -----------------------
  const selectablePlayers = players.filter((p) => p.id !== player?.id && p.active)

  // ----------------------- ações -----------------------
  const handleSave = () => {
    if (!name.trim()) return

    const pairs = preferredPair ? [preferredPair] : []

    if (mode === 'add') {
      add(name.trim(), Number(level), pairs)
      singleToastSuccess(`${name.trim()} adicionado`, { position: 'top-center', duration: 1000 })
      setName('')
      setPreferredPair('')
      nameInputRef.current?.focus()
      return
    }

    // modo edit
    updatePlayers((plrs) =>
      plrs.map((p) =>
        p.id === player!.id
          ? { ...p, name: name.trim() || p.name, level: Number(level), active, preferredPairs: pairs }
          : p,
      ),
    )
    setOpen(false)
  }

  const handleDelete = () => {
    remove(player!.id)
    setConfirmOpen(false)
  }

  // ----------------------- foco no input (se perder o foco) -----------------------
  const handleInputBlur = () => {
    if (open) {
      setTimeout(() => nameInputRef.current?.focus(), 0)
    }
  }

  // ----------------------- UI -----------------------
  const title = mode === 'add' ? 'Novo jogador' : 'Editar jogador'

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          resetForm()
          setConfirmOpen(false)
        }
        setOpen(o)
      }}
    >
      <DialogTrigger asChild onClick={() => setOpen(true)}>
        {trigger}
      </DialogTrigger>

      <DialogContent
        className="top-2 translate-y-2"
        onOpenAutoFocus={(e) => {
          e.preventDefault()
          nameInputRef.current?.focus()
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
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
              onChange={(e) => setName(e.target.value)}
              onBlur={handleInputBlur}
            />
          </div>

          {/* Nível */}
          <div className="grid gap-3">
            <Label htmlFor="player-level">Nível</Label>
            <ToggleGroup
              id="player-level"
              type="single"
              value={level}
              onValueChange={(val) => val && setLevel(val)}
              className="flex flex-wrap gap-2 w-full"
            >
              {LEVELS.map(({ value, label }) => (
                <ToggleGroupItem key={value} value={value.toString()} className="w-8 justify-center">
                  {label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Dupla preferida */}
          <div className="grid gap-3">
            <Label htmlFor="preferred-pair">Dupla preferida</Label>
            <Select value={preferredPair} onValueChange={(val) => setPreferredPair(val)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um parceiro…" />
              </SelectTrigger>
              <SelectContent side="top">
                {selectablePlayers.map((pl) => (
                  <SelectItem key={pl.id} value={pl.id} className="flex items-center gap-2">
                    {pl.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter className="flex-row justify-between">
          {mode === 'edit' && (
            <>
              {/* Botão que abre o ConfirmDialog */}
              <Button variant="ghost" aria-label={`Remover ${player!.name}`} onClick={() => setConfirmOpen(true)}>
                <Trash className="text-destructive" size={16} />
              </Button>

              {/* ConfirmDialog para exclusão */}
              <ConfirmDialog
                open={confirmOpen}
                onOpenChange={(open) => {
                  if (!open) setConfirmOpen(false)
                }}
                title={`Apagar jogador ${player!.name}?`}
                description="O jogador e suas estatísticas serão permanentemente apagados. Deseja continuar?"
                confirmText="Apagar jogador"
                cancelText="Cancelar"
                onConfirm={handleDelete}
                confirmVariant="destructive"
              />
            </>
          )}

          <div className="flex gap-2 ml-auto">
            <DialogClose asChild>
              <Button variant="outline">{mode === 'edit' ? 'Cancelar' : 'Voltar'}</Button>
            </DialogClose>
            <Button onClick={handleSave}>{mode === 'edit' ? 'Salvar' : 'Salvar'}</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default PlayerModal
