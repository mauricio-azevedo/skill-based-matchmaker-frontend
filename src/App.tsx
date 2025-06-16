// src/App.tsx

import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import PlayersTab from './components/PlayersTab'
import MatchesTab from './components/MatchesTab'
import LeaderboardTab from './components/LeaderboardTab'
import { Moon, Sun, Settings } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useRounds } from '@/context/RoundsContext'
import { usePlayers } from '@/context/PlayersContext'
import { singleToastSuccess } from '@/utils/singleToast'
import { seedPlayers } from '@/data/seedPlayers'
import { shuffle } from '@/utils/shuffle'
import { ConfirmDialog } from '@/components/ConfirmDialog'

export default function App() {
  // -----------------------------------------------------------
  // Tema (poderia ser trocado por useTheme() do next-themes)
  // -----------------------------------------------------------
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  // Estado do diálogo: null | 'rounds' | 'all'
  const [warning, setWarning] = useState<null | 'rounds' | 'all' | 'seed'>(null)

  // Aplica a classe "dark" na <html> root
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // -----------------------------------------------------------
  // Actions: limpar partidas e limpar tudo
  // -----------------------------------------------------------
  const { rounds, clear: clearRounds } = useRounds()
  const { players, updatePlayers } = usePlayers()

  // Verifica se os jogadores atuais correspondem exatamente ao seed (ignorando ordem)
  const isSeedLoaded = useMemo(() => {
    if (players.length !== seedPlayers.length) return false
    const seedIds = new Set(seedPlayers.map((p) => p.id))
    return players.every((p) => seedIds.has(p.id))
  }, [players])

  const hasRounds = rounds.length > 0
  const hasPlayers = players.length > 0
  const noData = !hasRounds && !hasPlayers

  const handleClearRounds = () => {
    clearRounds()
    updatePlayers((prev) =>
      prev.map((player) => ({
        ...player,
        matchCount: 0,
        partnerCounts: {},
      })),
    )
    singleToastSuccess('Todas as partidas apagadas!', { duration: 3000 })
  }

  const handleClearAll = () => {
    clearRounds()
    updatePlayers(() => [])
    singleToastSuccess('Todos os dados apagados!', { duration: 3000 })
  }

  const handleLoadSeed = () => {
    shuffle(seedPlayers)
    clearRounds()
    updatePlayers(() => seedPlayers)
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden gap-2 pb-2">
      {/* ---------- Header ---------- */}
      <header className="flex items-center border-b px-4 py-2">
        <h1 className="text-xl font-semibold tracking-tight">BeachRank</h1>
        <div className="ml-auto flex items-center gap-4">
          {/* Tema */}
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 transition-opacity" style={{ opacity: theme === 'light' ? 1 : 0.35 }} />
            <Switch
              id="theme-toggle"
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              aria-label="Alternar tema"
            />
            <Moon className="h-4 w-4 transition-opacity" style={{ opacity: theme === 'dark' ? 1 : 0.25 }} />
          </div>

          {/* Menu de configurações */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="rounded-md p-2 transition hover:bg-muted" aria-label="Configurações">
                <Settings className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem disabled={isSeedLoaded} onSelect={() => setWarning('seed')}>
                Inicializar jogadores
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!hasRounds}
                className="text-destructive"
                onSelect={() => setWarning('rounds')}
              >
                Limpar partidas
              </DropdownMenuItem>
              <DropdownMenuItem disabled={noData} className="text-destructive " onSelect={() => setWarning('all')}>
                Limpar tudo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

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
        open={warning === 'rounds'}
        onOpenChange={() => setWarning(null)}
        title="Limpar todas as partidas?"
        description="Esta ação apagará todos os registros de partidas. Você tem certeza?"
        confirmVariant="destructive"
        confirmText="Sim, limpar partidas"
        onConfirm={() => {
          handleClearRounds()
          setWarning(null)
        }}
      />

      <ConfirmDialog
        open={warning === 'all'}
        onOpenChange={() => setWarning(null)}
        title="Limpar todos os dados?"
        description="Isso removerá jogadores e partidas e não poderá ser desfeito. Deseja continuar?"
        confirmVariant="destructive"
        confirmText="Sim, limpar tudo"
        onConfirm={() => {
          handleClearAll()
          setWarning(null)
        }}
      />

      {/* ---------- Tabs ---------- */}
      <Tabs defaultValue="players" className="flex flex-col flex-grow overflow-hidden gap-2">
        {/* Conteúdo */}
        <main className="container mx-auto flex h-full max-w-lg flex-col px-2 flex-grow overflow-hidden items-center">
          <TabsContent value="players" asChild>
            <PlayersTab />
          </TabsContent>
          <TabsContent value="matches" asChild>
            <MatchesTab />
          </TabsContent>
          <TabsContent value="leaderboard" asChild>
            <LeaderboardTab />
          </TabsContent>
        </main>

        {/* Barra de triggers */}
        <TabsList className="self-center">
          <TabsTrigger value="players">Setup</TabsTrigger>
          <TabsTrigger value="matches">Partidas</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
