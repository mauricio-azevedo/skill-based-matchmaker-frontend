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
import { type FC, type FormEvent, type ReactNode, useCallback, useEffect, useState } from 'react'
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

  // submit do formulário (Enter)
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    handleSave()
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
        onOpenAutoFocus={(event) => {
          if (mode === 'edit') event.preventDefault()
        }}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {mode === 'edit' && <DialogDescription className="text-md">{player!.name}</DialogDescription>}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-4">
            {/* Nome */}
            <div className="grid gap-2">
              <Label htmlFor="player-name" className="text-md">
                Nome
              </Label>
              <Input
                id="player-name"
                className="h-11"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus={mode === 'add'}
              />
            </div>

            {/* Nível */}
            <div className="grid gap-2">
              <Label htmlFor="player-level" className="text-md">
                Nível
              </Label>
              <ToggleGroup
                id="player-level"
                type="single"
                value={level}
                onValueChange={(val) => val && setLevel(val)}
                className="flex flex-wrap gap-2 w-full h-11"
              >
                {LEVELS.map(({ value, label }) => (
                  <ToggleGroupItem key={value} value={value.toString()} className="h-11 justify-center text-md">
                    {label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>

            {/* Dupla preferida */}
            <div className="grid gap-2">
              <Label htmlFor="preferred-pair" className="text-md">
                Dupla preferida
              </Label>
              <Select value={preferredPair} onValueChange={(val) => setPreferredPair(val)}>
                <SelectTrigger className="w-full !h-11 text-md">
                  <SelectValue placeholder="Selecione um parceiro…" />
                </SelectTrigger>
                <SelectContent side="top">
                  {selectablePlayers.map((pl) => (
                    <SelectItem key={pl.id} value={pl.id} className="flex items-center gap-2 h-11 text-md">
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
                <Button
                  variant="ghost"
                  className="w-11 h-11"
                  aria-label={`Remover ${player!.name}`}
                  onClick={() => setConfirmOpen(true)}
                >
                  <Trash className="text-destructive !w-4.5 !h-4.5" />
                </Button>

                {/* ConfirmDialog para exclusão */}
                <ConfirmDialog
                  open={confirmOpen}
                  onOpenChange={(open) => {
                    if (!open) setConfirmOpen(false)
                  }}
                  title={`Apagar jogador ${player!.name}?`}
                  description={
                    <p>
                      O jogador e suas estatísticas serão permanentemente apagados.{' '}
                      <span className="text-nowrap">Deseja continuar?</span>
                    </p>
                  }
                  confirmText="Apagar jogador"
                  cancelText="Cancelar"
                  onConfirm={handleDelete}
                  confirmVariant="destructive"
                />
              </>
            )}

            <div className="flex gap-2 ml-auto">
              <DialogClose asChild>
                <Button size="lg" className="h-11" variant="outline">
                  {mode === 'edit' ? 'Cancelar' : 'Voltar'}
                </Button>
              </DialogClose>
              <Button size="lg" className="h-11" type="submit">
                {mode === 'edit' ? 'Salvar' : 'Salvar'}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default PlayerModal
