import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useMatches } from '@/context/MatchesContext'
import { usePlayers } from '@/context/PlayersContext'
import { singleToastSuccess } from '@/utils/singleToast'
import { useVersionGuard } from '@/hooks/useVersionGuard'
import { Separator } from '@/components/ui/separator'

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
    singleToastSuccess('Todas as partidas apagadas!', { duration: 1000 })
  }

  const handleClearAll = () => {
    performVersionCleanup()
    singleToastSuccess('Todos os dados apagados!', { duration: 1000 })
  }

  return (
    <div className="flex flex-col w-full">
      <h2 className="text-lg font-semibold leading-tight m-0 text-center">Configurações</h2>

      <Separator className="mt-2 mb-0" />

      <div className="flex flex-col gap-2 p-4">
        <Button size="sm" onClick={() => setWarning('matches')} variant="destructive" className="w-full">
          Excluir partidas
        </Button>
        <Button size="sm" onClick={() => setWarning('all')} variant="destructive" className="w-full">
          Excluir tudo
        </Button>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={warning === 'matches'}
        onOpenChange={() => setWarning(null)}
        title="Excluir partidas?"
        description="Partidas em andamento e do histórico serão permanentemente excluídas. Deseja continuar?"
        confirmVariant="destructive"
        confirmText="Excluir partidas"
        onConfirm={() => {
          handleClearMatches()
          setWarning(null)
        }}
      />
      <ConfirmDialog
        open={warning === 'all'}
        onOpenChange={() => setWarning(null)}
        title="Excluir tudo?"
        description="Jogadores, quadras e partidas serão permanentemente excluídos. Deseja continuar?"
        confirmVariant="destructive"
        confirmText="Excluir tudo"
        onConfirm={() => {
          handleClearAll()
          setWarning(null)
        }}
      />
    </div>
  )
}
