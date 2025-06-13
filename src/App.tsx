// src/App.tsx

import { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import PlayersTab from './components/PlayersTab'
import MatchesTab from './components/MatchesTab'
import LeaderboardTab from './components/LeaderboardTab'
import { Moon, Sun, Settings } from 'lucide-react'
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useRounds } from '@/context/RoundsContext'
import { usePlayers } from '@/context/PlayersContext'

// ✨ NEW: AlertDialog components for confirmation
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { buttonVariants } from '@/components/ui/button'

export default function App() {
  // -----------------------------------------------------------
  // Tema (poderia ser trocado por useTheme() do next-themes)
  // -----------------------------------------------------------
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

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
    toast.success('Todas as partidas apagadas!', { duration: 3000 })
  }

  const handleClearAll = () => {
    clearRounds()
    updatePlayers(() => []) // remove todos os jogadores
    toast.success('Todos os dados apagados!', { duration: 3000 })
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden gap-2 pb-2">
      {/* ---------- Header ---------- */}
      <header className="flex items-center border-b px-4 py-2">
        <h1 className="text-xl font-semibold tracking-tight">BeachRank</h1>
        <div className="ml-auto flex items-center gap-4">
          {/* Ícone do sol — fica mais “aceso” no modo claro */}
          <Sun
            className="h-4 w-4 transition-opacity"
            aria-hidden="true"
            style={{ opacity: theme === 'light' ? 1 : 0.35 }}
          />

          {/* Switch do shadcn controla o tema */}
          <Switch
            id="theme-toggle"
            checked={theme === 'dark'}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            aria-label="Toggle dark mode"
          />

          {/* Ícone da lua — fica mais “acesa” no modo escuro */}
          <Moon
            className="h-4 w-4 transition-opacity"
            aria-hidden="true"
            style={{ opacity: theme === 'dark' ? 1 : 0.25 }}
          />

          {/* Botão de configuração com menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                aria-label="Configurações"
                className="rounded-md p-2 transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2"
              >
                <Settings className="h-4 w-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* ---------- Confirmação para limpar partidas ---------- */}
              <AlertDialog>
                <AlertDialogTrigger disabled={!hasRounds} asChild>
                  <DropdownMenuItem
                    // Evita que o Dropdown feche antes do diálogo abrir
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    Limpar partidas
                  </DropdownMenuItem>
                </AlertDialogTrigger>
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
                      onClick={handleClearRounds}
                    >
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              {/* ---------- Confirmação para limpar tudo ---------- */}
              <AlertDialog>
                <AlertDialogTrigger disabled={noData} asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-destructive focus:text-destructive cursor-pointer"
                  >
                    Limpar tudo
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Limpar todos os dados?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Isso removerá jogadores e partidas e não poderá ser desfeito. Deseja continuar?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction className={buttonVariants({ variant: 'destructive' })} onClick={handleClearAll}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

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
          <TabsTrigger value="players">Jogadores</TabsTrigger>
          <TabsTrigger value="matches">Partidas</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
