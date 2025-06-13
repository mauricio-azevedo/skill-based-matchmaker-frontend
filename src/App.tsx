// App.tsx — versão que usa shadcn/ui
// Pré-requisitos: shadcn add tabs switch button (e theme-provider, que já vem no template)

import { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import PlayersTab from './components/PlayersTab'
import MatchesTab from './components/MatchesTab'
import LeaderboardTab from './components/LeaderboardTab'
import { Moon, Sun } from 'lucide-react'

// Se você tiver copiado o ThemeProvider do boilerplate do shadcn,
// descomente estas duas linhas e envolva o <App /> no ThemeProvider no entry (main.tsx).
// import { ThemeProvider } from "@/components/theme-provider"
//
// <ThemeProvider>
//    <App />
// </ThemeProvider>

export default function App() {
  // controla o modo; se preferir, troque por useTheme() do next-themes
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  // aplica a classe "dark" na <html> root
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="flex flex-col h-[90vh] overflow-hidden gap-4">
      {/* ---------- Header ---------- */}
      <header className="flex items-center border-b px-4 py-2">
        <h1 className="text-xl font-semibold tracking-tight">BeachRank</h1>
        <div className="ml-auto flex items-center gap-4">
          {/* Switch do shadcn controla o tema */}
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
        </div>
      </header>

      {/* ---------- Tabs ---------- */}
      <Tabs defaultValue="players" className="flex flex-col flex-grow overflow-hidden gap-4">
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

      {/* ---------- Footer ---------- */}
      <footer className="border-t p-4 text-center text-xs opacity-60">© 2025 Skill-Based Matchmaker</footer>
    </div>
  )
}
