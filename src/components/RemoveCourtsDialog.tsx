import { type FC, useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

interface CourtOption {
  id: string
  label: string
  players: string[]
}

interface RemoveCourtsDialogProps {
  open: boolean
  onCancel: () => void
  onConfirm: (selectedCourtIds: string[]) => void
  options: CourtOption[]
  toRemoveCount: number
}

export const RemoveCourtsDialog: FC<RemoveCourtsDialogProps> = ({
  open,
  onCancel,
  onConfirm,
  options,
  toRemoveCount,
}) => {
  const [selected, setSelected] = useState<string[]>([])

  // resetar seleção quando abrir o diálogo
  useEffect(() => {
    if (open) setSelected([])
  }, [open])

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      setSelected((s) => s.filter((x) => x !== id))
    } else if (selected.length < toRemoveCount) {
      setSelected((s) => [...s, id])
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Escolha {toRemoveCount} quadra{toRemoveCount > 1 ? 's' : ''} para remover
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2 max-h-60 overflow-auto">
          {options.map((opt) => {
            const disabled = !selected.includes(opt.id) && selected.length >= toRemoveCount
            return (
              <label key={opt.id} className="flex items-start p-2 border rounded cursor-pointer">
                <Checkbox
                  checked={selected.includes(opt.id)}
                  disabled={disabled}
                  onCheckedChange={() => toggle(opt.id)}
                  className="mt-1 mr-2"
                />
                <div>
                  <p className="font-medium">{opt.label}</p>
                  <p className="text-sm text-muted-foreground">{opt.players.join(' vs ')}</p>
                </div>
              </label>
            )
          })}
        </div>

        <DialogFooter className="mt-4">
          <Button variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
          <Button onClick={() => onConfirm(selected)} disabled={selected.length !== toRemoveCount}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
