// src/components/EditPlayerModal.tsx
import { useState, type FC, useEffect } from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Edit, Trash } from 'lucide-react'
import { usePlayers } from '@/context/PlayersContext'
import type { Player } from '@/types/players'

interface EditPlayerModalProps {
  player: Player
}

/**
 * Modal para editar ou remover um jogador.
 * Confirma exclusão usando AlertDialog.
 */
const EditPlayerModal: FC<EditPlayerModalProps> = ({ player }) => {
  const { updatePlayers, remove } = usePlayers()

  // estado local para editar
  const [name, setName] = useState(player.name)
  const [level, setLevel] = useState(player.level)
  const [active, setActive] = useState(player.active)

  // sincroniza ao reabrir modal, caso o jogador seja recarregado
  useEffect(() => {
    setName(player.name)
    setLevel(player.level)
    setActive(player.active)
  }, [player])

  const handleSave = () => {
    updatePlayers((players) =>
      players.map((p) => (p.id === player.id ? { ...p, name: name.trim() || p.name, level, active } : p)),
    )
  }

  const handleDelete = () => {
    remove(player.id)
  }

  return (
    <Dialog>
      {/* Trigger: ícone de lápis */}
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Editar ${player.name}`}>
          <Edit size={16} />
        </Button>
      </DialogTrigger>

      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Editar jogador</DialogTitle>
          <DialogDescription>{player.name}</DialogDescription>
        </DialogHeader>

        {/* Form simples */}
        <div className="flex flex-col gap-6">
          <div className="grid gap-3">
            <Label htmlFor="player-name">Nome</Label>
            <Input id="player-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="grid gap-3">
            <Label htmlFor="edit-level">Nível</Label>
            <ToggleGroup
              id="edit-level"
              type="single"
              value={level.toString()}
              onValueChange={(val: string) => val && setLevel(Number(val))}
              className="flex flex-wrap gap-2 w-full"
            >
              {Array.from({ length: 5 }, (_, i) => i + 1).map((lvl) => (
                <ToggleGroupItem
                  key={lvl}
                  value={lvl.toString()}
                  aria-label={`Level ${lvl}`}
                  className="w-8 justify-center"
                >
                  {lvl}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Ativo/Inativo */}
          <div className="flex items-center gap-2">
            <Label htmlFor="edit-active" className="text-sm">
              Ativo
            </Label>
            <Switch id="edit-active" checked={active} onCheckedChange={(checked) => setActive(checked)} />
          </div>
        </div>

        <DialogFooter>
          <div className="flex flex-row justify-between w-full">
            {/* Deleção com confirmação */}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" aria-label={`Remover ${player.name}`}>
                  <Trash className="text-destructive" size={16} />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja remover <strong>{player.name}</strong>?
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

            <div className="flex gap-2">
              <DialogClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button type="submit" onClick={handleSave}>
                  Salvar
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditPlayerModal
