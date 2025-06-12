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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Edit } from 'lucide-react'
import { usePlayers } from '@/context/PlayersContext'
import type { Player } from '@/types/players'

interface EditPlayerModalProps {
  player: Player
}

/**
 * Modal para editar ou remover um jogador.
 * Segue SRP: apenas aqui ficam os controles de edição/exclusão.
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

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Jogador</DialogTitle>
          <DialogDescription>Altere nome, nível ou status; ou remova.</DialogDescription>
        </DialogHeader>

        {/* Form simples */}
        <div className="flex flex-col gap-4">
          {/* Nome */}
          <div className="grid gap-1">
            <Label htmlFor="edit-name">Nome</Label>
            <Input id="edit-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          {/* Nível */}
          <div className="grid gap-1">
            <Label htmlFor="edit-level">Nível</Label>
            <ToggleGroup
              id="edit-level"
              type="single"
              value={level.toString()}
              onValueChange={(val: string) => val && setLevel(Number(val))}
              className="flex flex-wrap gap-2"
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

        <DialogFooter className="justify-between">
          {/* Apagar */}
          <Button variant="destructive" onClick={handleDelete}>
            Apagar
          </Button>

          <div className="flex gap-2">
            <DialogClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DialogClose>
            <DialogClose asChild>
              <Button onClick={handleSave}>Salvar</Button>
            </DialogClose>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default EditPlayerModal
