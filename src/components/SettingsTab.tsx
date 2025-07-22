import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useMatches } from '@/context/MatchesContext'
import { usePlayers } from '@/context/PlayersContext'
import { singleToastSuccess } from '@/utils/singleToast'
import { useVersionGuard } from '@/hooks/useVersionGuard'

export function SettingsTab() {
  const [warning, setWarning] = useState<null | 'matches' | 'all'>(null)

  const { clearMatches } = useMatches()
  const { performVersionCleanup } = useVersionGuard()
  const { updatePlayers } = usePlayers()

  const handleClearMatches = () => {
    clearMatches()
    updatePlayers((prev) =>
      prev.map((player) => ({
        ...player,
        matchCount: 0,
        partnerCounts: {},
      })),
    )
    singleToastSuccess('Todas as partidas apagadas', { duration: 1000 })
  }

  const handleClearAll = () => {
    performVersionCleanup()
    singleToastSuccess('Todos os dados apagados', { duration: 1000 })
  }

  return (
    <div className="flex flex-col w-full h-full justify-between items-center">
      <div className="w-full border-b border-border min-h-11 max-h-11 flex items-center justify-center relative">
        <h2 className="text-xl font-semibold leading-tight m-0">Configurações</h2>
      </div>

      <p className="text-md text-muted-foreground">Mais configurações em breve...</p>

      <div className="flex flex-col gap-2 px-4 w-full mb-4">
        <Button onClick={() => setWarning('matches')} variant="destructive" className="w-full h-11 text-md">
          Apagar partidas
        </Button>
        <Button onClick={() => setWarning('all')} variant="destructive" className="w-full h-11 text-md">
          Apagar tudo
        </Button>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={warning === 'matches'}
        onOpenChange={() => setWarning(null)}
        title="Apagar partidas?"
        description={
          <p>
            Partidas em andamento e do histórico serão permanentemente apagadas.{' '}
            <span className="text-nowrap">Deseja continuar?</span>
          </p>
        }
        confirmVariant="destructive"
        confirmText="Apagar partidas"
        onConfirm={() => {
          handleClearMatches()
          setWarning(null)
        }}
      />
      <ConfirmDialog
        open={warning === 'all'}
        onOpenChange={() => setWarning(null)}
        title="Apagar tudo?"
        description={
          <p>
            Jogadores, quadras e partidas serão permanentemente apagados.{' '}
            <span className="text-nowrap">Deseja continuar?</span>
          </p>
        }
        confirmVariant="destructive"
        confirmText="Apagar tudo"
        onConfirm={() => {
          handleClearAll()
          setWarning(null)
        }}
      />
    </div>
  )
}
