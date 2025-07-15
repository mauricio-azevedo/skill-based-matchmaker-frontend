import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { useMatches } from '@/context/MatchesContext'
import { useCourts } from '@/context/CourtsContext'
import { usePlayers } from '@/context/PlayersContext'
import { singleToastSuccess } from '@/utils/singleToast'
import { Separator } from '@radix-ui/react-select'
import { useVersionGuard } from '@/hooks/useVersionGuard'

export function SettingsTab() {
  const [warning, setWarning] = useState<null | 'matches' | 'all'>(null)

  const { matches, clearMatches } = useMatches()
  const { courts } = useCourts()
  const { performVersionCleanup } = useVersionGuard()
  const { updatePlayers } = usePlayers()

  const hasMatches = matches.length > 0
  const hasCourts = courts.length > 0
  const noData = !hasMatches && !hasCourts

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

      <div className="flex flex-col gap-4 p-4">
        <Button
          size="sm"
          disabled={!hasMatches}
          onClick={() => setWarning('matches')}
          variant="destructive"
          className="w-full"
        >
          Limpar partidas
        </Button>
        <Button size="sm" disabled={noData} onClick={() => setWarning('all')} variant="destructive" className="w-full">
          Limpar tudo
        </Button>
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={warning === 'matches'}
        onOpenChange={() => setWarning(null)}
        title="Limpar todas as partidas?"
        description="Esta ação apagará todos os registros de partidas. Você tem certeza?"
        confirmVariant="destructive"
        confirmText="Sim, limpar partidas"
        onConfirm={() => {
          handleClearMatches()
          setWarning(null)
        }}
      />
      <ConfirmDialog
        open={warning === 'all'}
        onOpenChange={() => setWarning(null)}
        title="Limpar todos os dados?"
        description="Excluir permanentemente jogadores, quadras, partidas e configurações? Esta operação não pode ser desfeita."
        confirmVariant="destructive"
        confirmText="Sim, limpar tudo"
        onConfirm={() => {
          handleClearAll()
          setWarning(null)
        }}
      />
    </div>
  )
}
