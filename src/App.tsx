// src/App.tsx

import { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import PlayersTab from './components/PlayersTab'
import MatchesTab from './components/MatchesTab'
import LeaderboardTab from './components/LeaderboardTab'
import { Moon, Sun, Settings } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useRounds } from '@/context/RoundsContext'
import { usePlayers } from '@/context/PlayersContext'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'
import { singleToastSuccess } from '@/utils/singleToast'

export default function App() {
  // -----------------------------------------------------------
  // Tema (poderia ser trocado por useTheme() do next-themes)
  // -----------------------------------------------------------
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  // Estado do diálogo: null | 'rounds' | 'all'
  const [warning, setWarning] = useState<null | 'rounds' | 'all'>(null)

  // Aplica a classe "dark" na <html> root
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  // -----------------------------------------------------------
  // Actions: limpar partidas e limpar tudo
  // -----------------------------------------------------------
  const { rounds, clear: clearRounds } = useRounds()
  const { players, updatePlayers } = usePlayers()

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

  const handleTitleDoubleClick = () => {
    singleToastSuccess('🏖️ Você encontrou o easter egg!', { duration: 3000 })
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden gap-2 pb-2">
      {/* ---------- Header ---------- */}
      <header className="flex items-center border-b px-4 py-2">
        <h1 className="text-xl font-semibold tracking-tight" onDoubleClick={handleTitleDoubleClick}>
          BeachRank
        </h1>
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
              <DropdownMenuItem
                disabled={!hasRounds}
                className="text-destructive cursor-pointer"
                onSelect={() => setWarning('rounds')}
              >
                Limpar partidas
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={noData}
                className="text-destructive cursor-pointer"
                onSelect={() => setWarning('all')}
              >
                Limpar tudo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* ---------- AlertDialogs (fora do menu, padrão Radix) ---------- */}
      {/* Limpar partidas */}
      <AlertDialog open={warning === 'rounds'} onOpenChange={() => setWarning(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar todas as partidas?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação apagará todos os registros de partidas. Você tem certeza?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={() => {
                handleClearRounds()
                setWarning(null)
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Limpar tudo */}
      <AlertDialog open={warning === 'all'} onOpenChange={() => setWarning(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Limpar todos os dados?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso removerá jogadores e partidas e não poderá ser desfeito. Deseja continuar?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: 'destructive' })}
              onClick={() => {
                handleClearAll()
                setWarning(null)
              }}
            >
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
