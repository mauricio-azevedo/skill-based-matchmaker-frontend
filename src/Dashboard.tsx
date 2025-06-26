import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PlayersTab from '@/components/PlayersTab'
import MatchesTab from '@/components/MatchesTab'
import LeaderboardTab from '@/components/LeaderboardTab'

export default function Dashboard() {
  return (
    <div className="flex flex-col h-dvh overflow-hidden gap-2 pb-2">
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
