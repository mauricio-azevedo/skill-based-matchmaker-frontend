import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Settings } from '@/components/Settings'
import { PlayersTab } from '@/components/PlayersTab'

export function SetupTab() {
  return (
    <Tabs defaultValue="players" className="w-full h-full flex flex-col items-center pl-4">
      {/* Lista de abas */}
      <TabsList className="border-b">
        <TabsTrigger value="players">Jogadores</TabsTrigger>
        <TabsTrigger value="settings">Configurações</TabsTrigger>
      </TabsList>

      {/* Jogadores */}
      <TabsContent value="players" className="flex-1 overflow-auto pt-2 w-full">
        <PlayersTab />
      </TabsContent>

      {/* Configurações */}
      <TabsContent value="settings" className="flex-1 overflow-auto pt-2 w-full">
        <Settings />
      </TabsContent>
    </Tabs>
  )
}
