// App.tsx — versão que usa shadcn/ui
// Pré-requisitos: shadcn add tabs switch button (e theme-provider, que já vem no template)

import { useEffect, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import PlayersTab from './components/PlayersTab'
import MatchesTab from './components/MatchesTab'
import LeaderboardTab from './components/LeaderboardTab'

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
    <div className="flex flex-col h-screen overflow-hidden">
      {/* ---------- Header ---------- */}
      <header className="flex items-center border-b px-4 py-2">
        <h1 className="text-xl font-semibold tracking-tight">Skill-Based Matchmaker</h1>
        <div className="ml-auto flex items-center gap-2">
          {/* Switch do shadcn controla o tema */}
          <Switch
            id="theme-toggle"
            checked={theme === 'dark'}
            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            aria-label="Toggle dark mode"
          />
        </div>
      </header>

      {/* ---------- Tabs ---------- */}
      <Tabs defaultValue="players" className="flex flex-col flex-grow overflow-hidden">
        {/* Barra de triggers */}
        <TabsList className="self-center mt-4">
          <TabsTrigger value="players">Players</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
        </TabsList>

        {/* Conteúdo */}
        <main className="flex-grow overflow-hidden">
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
      </Tabs>

      {/* ---------- Footer ---------- */}
      <footer className="border-t p-4 text-center text-xs opacity-60">© 2025 Skill-Based Matchmaker</footer>
    </div>
  )
}
