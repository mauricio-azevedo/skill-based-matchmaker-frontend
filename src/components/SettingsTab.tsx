import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { usePlayers } from '@/context/PlayersContext'
import { useMatches } from '@/context/MatchesContext'
import { useCourts } from '@/context/CourtsContext'
import { singleToastSuccess } from '@/utils/singleToast'
import { seedPlayers } from '@/data/seedPlayers'
import { shuffle } from '@/utils/shuffle'
import { Separator } from '@/components/ui/separator'

export function SettingsTab() {
  const [warning, setWarning] = useState<null | 'matches' | 'all' | 'seed'>(null)

  const { matches, clearMatches } = useMatches()
  const { courts, clearCourts } = useCourts()
  const { players, updatePlayers, add } = usePlayers()

  const isSeedLoaded = useMemo(() => {
    if (players.length !== seedPlayers.length) return false
    const seedSet = new Set(seedPlayers.map(({ name, level }) => `${name}-${level}`))
    return players.every(({ name, level }) => seedSet.has(`${name}-${level}`))
  }, [players])

  const hasMatches = matches.length > 0
  const hasPlayers = players.length > 0
  const hasCourts = courts.length > 0
  const noData = !hasMatches && !hasPlayers && !hasCourts

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
    window.localStorage.clear()
    clearMatches()
    clearCourts()
    updatePlayers(() => [])
    singleToastSuccess('Todos os dados apagados!', { duration: 1000 })
  }

  const handleLoadSeed = () => {
    clearMatches()
    updatePlayers(() => [])

    const seeds = [...seedPlayers]
    shuffle(seeds)
    seeds.forEach(({ id, name, level, preferredPairs = [] }) => {
      add(name, level, preferredPairs, id)
    })

    singleToastSuccess('Jogadores inicializados!', { duration: 1000 })
  }

  return (
    <div className="flex flex-col w-full">
      <h2 className="text-lg font-semibold leading-tight m-0 text-center">Configurações</h2>

      <Separator className="mt-2 mb-0" />

      <div className="flex flex-col gap-4 p-4">
        <Button
          size="sm"
          disabled={isSeedLoaded}
          onClick={() => setWarning('seed')}
          variant="secondary"
          className="w-full"
        >
          Inicializar jogadores
        </Button>
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
        open={warning === 'seed'}
        onOpenChange={() => setWarning(null)}
        title="Inicializar jogadores?"
        description="Esta ação apagará os registros atuais de jogadores e partidas e carregará os jogadores pré definidos. Deseja continuar?"
        confirmText="Sim, inicializar jogadores"
        onConfirm={() => {
          handleLoadSeed()
          setWarning(null)
        }}
      />
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
