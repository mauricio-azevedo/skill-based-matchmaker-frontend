import { useCallback, useState } from 'react'
import { PlayerEntry } from '@/components/PlayerEntry'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useMatchManager } from '@/hooks/useMatchManager'
import { type Match, type MatchPlayers } from '@/types/entities'
import { usePlayers } from '@/context/PlayersContext'
import { XIcon } from 'lucide-react'
import { Description } from '@radix-ui/react-dialog'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  match: Match
}

export function SelectAlternativeDialog({ open, onOpenChange, match }: Props) {
  const { selectAlternative } = useMatchManager()
  const { getById } = usePlayers()
  const [selected, setSelected] = useState<MatchPlayers | null>(null)

  const handleConfirm = useCallback(() => {
    if (selected) {
      selectAlternative(match.id, selected)
      onOpenChange(false)
    }
  }, [selected, selectAlternative, match.id, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Escolher confronto alternativo</DialogTitle>
          <Description className="text-muted-foreground">
            Todas as alternativas mantêm equilibrado o número de partidas entre os jogadores
          </Description>
        </DialogHeader>

        <div className="flex flex-col gap-2">
          {match.alternatives.map((alt, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(alt)}
              className={`p-3 rounded-lg border border-accent
              ${selected === alt && ' bg-accent'}
              hover:bg-accent transition-colors text-left`}
            >
              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 w-full">
                <div className="flex flex-col gap-2 min-w-0">
                  <PlayerEntry name={getById(alt.teamAPlayer1)?.name || 'Desconhecido'} />
                  <PlayerEntry name={getById(alt.teamAPlayer2)?.name || 'Desconhecido'} />
                </div>

                <XIcon className="text-muted-foreground !w-4 !h-4" />

                <div className="flex flex-col gap-2 min-w-0">
                  <PlayerEntry name={getById(alt.teamBPlayer1)?.name || 'Desconhecido'} reverse />
                  <PlayerEntry name={getById(alt.teamBPlayer2)?.name || 'Desconhecido'} reverse />
                </div>
              </div>
            </button>
          ))}

          {match.alternatives.length === 0 && (
            <p className="text-muted-foreground text-center text-md my-4">Nenhuma alternativa disponível.</p>
          )}
        </div>

        <DialogFooter className="flex gap-2 flex-row">
          <DialogClose asChild>
            <Button size="lg" className="h-11 text-md flex-1" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button size="lg" className="h-11 text-md flex-1" onClick={handleConfirm} disabled={!selected}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
