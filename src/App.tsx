import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import PlayersTab from './components/PlayersTab'
import LeaderboardTab from './components/LeaderboardTab'
import { Moon, Settings, Sun } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { usePlayers } from '@/context/PlayersContext'
import { singleToastSuccess } from '@/utils/singleToast'
import { seedPlayers } from '@/data/seedPlayers'
import { shuffle } from '@/utils/shuffle'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { MatchesTab } from '@/components/MatchesTab'

import { Dialog, DialogClose, DialogContent, DialogTrigger } from '@/components/ui/dialog'
import { SetupTab } from '@/components/SetupTab'
import { PlayTab } from '@/features/playTab/PlayTab'
import { useMatches } from '@/context/MatchesContext'

export default function App() {
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  const [warning, setWarning] = useState<null | 'matches' | 'all' | 'seed'>(null)
  const [isSetupOpen, setIsSetupOpen] = useState(false)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  const { matches, clearMatches } = useMatches()
  const { players, updatePlayers, add } = usePlayers()

  const isSeedLoaded = useMemo(() => {
    if (players.length !== seedPlayers.length) return false
    const seedSet = new Set(seedPlayers.map(({ name, level }) => `${name}-${level}`))
    return players.every(({ name, level }) => seedSet.has(`${name}-${level}`))
  }, [players])

  const hasMatches = matches.length > 0
  const hasPlayers = players.length > 0
  const noData = !hasMatches && !hasPlayers

  const handleClearMatches = () => {
    clearMatches()
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
    clearMatches()
    updatePlayers(() => [])
    singleToastSuccess('Todos os dados apagados!', { duration: 3000 })
  }

  const handleLoadSeed = () => {
    clearMatches()
    updatePlayers(() => [])

    const seeds = [...seedPlayers]
    shuffle(seeds)
    seeds.forEach(({ name, level, preferredPairs = [] }) => {
      add(name, level, preferredPairs)
    })

    singleToastSuccess('Jogadores inicializados a partir do seed!', { duration: 3000 })
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden gap-2 pb-2">
      {/* Header */}
      <header className="flex items-center border-b px-2 py-2">
        <h1 className="text-xl font-semibold tracking-tight">PLAY!</h1>
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
                disabled={!hasMatches}
                className="text-destructive"
                onSelect={() => setWarning('matches')}
              >
                Limpar partidas
              </DropdownMenuItem>
              <DropdownMenuItem disabled={noData} className="text-destructive" onSelect={() => setWarning('all')}>
                Limpar tudo
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setIsSetupOpen(true)}>Setup</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

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
        description="Isso removerá jogadores e partidas e não poderá ser desfeito. Deseja continuar?"
        confirmVariant="destructive"
        confirmText="Sim, limpar tudo"
        onConfirm={() => {
          handleClearAll()
          setWarning(null)
        }}
      />

      {/* Modal Setup */}
      <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
        <DialogTrigger />
        <DialogContent>
          <SetupTab />
          <DialogClose asChild>
            <button className="btn btn-primary">Fechar</button>
          </DialogClose>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs defaultValue="play" className="flex flex-col flex-grow overflow-hidden gap-2">
        <main className="container mx-auto flex h-full max-w-lg flex-col px-2 flex-grow overflow-hidden items-center gap-2">
          <TabsContent value="players" asChild>
            <PlayersTab />
          </TabsContent>
          <TabsContent value="matches" asChild>
            <MatchesTab />
          </TabsContent>
          <TabsContent value="play" asChild>
            <PlayTab />
          </TabsContent>
          <TabsContent value="leaderboard" asChild>
            <LeaderboardTab />
          </TabsContent>
        </main>

        <TabsList className="self-center">
          <TabsTrigger value="players">Jogadores</TabsTrigger>
          <TabsTrigger value="play">PLAY!</TabsTrigger>
          <TabsTrigger value="matches">Jogos</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
