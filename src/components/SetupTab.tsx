import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import PlayersTab from './PlayersTab'
import { CourtList } from '@/components/CourtList'
import { Settings } from '@/components/Settings'

export function SetupTab() {
  return (
    <Tabs defaultValue="jogadores" className="w-full h-full flex flex-col">
      {/* Lista de abas */}
      <TabsList className="border-b">
        <TabsTrigger value="players">Jogadores</TabsTrigger>
        <TabsTrigger value="courts">Quadras</TabsTrigger>
        <TabsTrigger value="settings">Configurações</TabsTrigger>
      </TabsList>

      {/* Jogadores */}
      <TabsContent value="players" className="flex-1 overflow-auto pt-2">
        <PlayersTab />
      </TabsContent>

      {/* Quadras */}
      <TabsContent value="courts" className="flex-1 overflow-auto pt-2">
        <CourtList />
      </TabsContent>

      {/* Configurações */}
      <TabsContent value="settings" className="flex-1 overflow-auto pt-2">
        <Settings />
      </TabsContent>
    </Tabs>
  )
}
