import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import LeaderboardTab from './components/LeaderboardTab'
import { Clock, Moon, Play, SettingsIcon, Sun, Trophy, Users } from 'lucide-react'
import { usePlayerMatchSync } from '@/hooks/usePlayerMatchSync'
import { PlayersTab } from '@/components/PlayersTab'
import { SettingsTab } from '@/components/SettingsTab'
import { MatchesTab } from '@/components/MatchesTab'
import { PlayTab } from '@/features/playTab/PlayTab'

export default function App() {
  usePlayerMatchSync()

  const [theme, setTheme] = useState<'light' | 'dark'>('dark')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return (
    <div className="flex flex-col h-dvh overflow-hidden pb-2">
      {/* Header */}
      <header className="flex items-center border-b px-4 py-2">
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
        </div>
      </header>

      {/* Tabs */}
      <Tabs defaultValue="play" className="flex flex-col flex-grow overflow-hidden gap-2">
        <main className="container mx-auto flex flex-1 max-w-lg flex-col flex-grow overflow-hidden items-center gap-2">
          <TabsContent value="setup" asChild>
            <SettingsTab />
          </TabsContent>
          <TabsContent value="players" asChild>
            <PlayersTab />
          </TabsContent>
          <TabsContent value="play" asChild>
            <PlayTab />
          </TabsContent>
          <TabsContent value="history" asChild>
            <MatchesTab />
          </TabsContent>
          <TabsContent value="leaderboard" asChild>
            <LeaderboardTab />
          </TabsContent>
        </main>

        <div className="flex w-full px-4 justify-center">
          <TabsList className="h-fit w-full">
            <TabsTrigger className="!h-11 m-0 p-0" value="setup" aria-label="Configuração">
              <SettingsIcon className="!w-4.5 !h-4.5" />
            </TabsTrigger>
            <TabsTrigger className="!h-11 m-0 p-0" value="players" aria-label="Jogadores">
              <Users className="!w-4.5 !h-4.5" />
            </TabsTrigger>
            <TabsTrigger className="!h-11 m-0 p-0" value="play" aria-label="Jogar">
              <Play className="!w-4.5 !h-4.5" />
            </TabsTrigger>
            <TabsTrigger className="!h-11 m-0 p-0" value="history" aria-label="Histórico">
              <Clock className="!w-4.5 !h-4.5" />
            </TabsTrigger>
            <TabsTrigger className="!h-11 m-0 p-0" value="leaderboard" aria-label="Leaderboard">
              <Trophy className="!w-4.5 !h-4.5" />
            </TabsTrigger>
          </TabsList>
        </div>
      </Tabs>
    </div>
  )
}
