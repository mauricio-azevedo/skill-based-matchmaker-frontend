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
          Apagar partidas
        </Button>
        <Button size="sm" onClick={() => setWarning('all')} variant="destructive" className="w-full">
          Apagar tudo
        </Button>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={warning === 'matches'}
        onOpenChange={() => setWarning(null)}
        title="Apagar partidas?"
        description="Partidas em andamento e do histórico serão permanentemente apagadas. Deseja continuar?"
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
        description="Jogadores, quadras e partidas serão permanentemente apagadas. Deseja continuar?"
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
