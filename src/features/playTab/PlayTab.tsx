import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CourtCard } from '@/components/CourtCard'
import { usePlayTabLogic } from './usePlayTabLogic'

export function PlayTab() {
  const { rows, state, canGenerate, handleAddCourt, handleGenerate, handleSelect, handleSaveScore } = usePlayTabLogic()

  return (
    <div className="flex flex-col gap-4">
      {/* Barra global de ações */}
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2" onClick={handleAddCourt}>
          <Plus size={16} />
          Adicionar quadra
        </Button>
      </div>

      {/* Lista de quadras */}
      {rows.map(({ id }) => (
        <CourtCard
          key={id}
          courtId={id}
          rounds={state.rounds[id] ?? []}
          selected={state.selected[id] ?? -1}
          onGenerate={() => handleGenerate(id)}
          onSelect={(i) => handleSelect(id, i)}
          onSaveScore={(a, b) => handleSaveScore(id, a, b)}
          canGenerate={canGenerate}
          loading={state.loading[id] ?? false}
        />
      ))}
    </div>
  )
}
