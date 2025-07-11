import { CourtCard } from '@/components/CourtCard'
import { usePlayTabLogic } from './usePlayTabLogic'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export function PlayTab() {
  const {
    rows,
    state,
    courtFinished,
    canGenerateGlobal,
    handleAddCourt,
    handleGenerate,
    handleSelect,
    handleSaveScore,
  } = usePlayTabLogic()

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2" onClick={handleAddCourt}>
          <Plus size={16} /> Adicionar quadra
        </Button>
      </div>

      {rows.map(({ id }) => {
        const canGenerate = canGenerateGlobal && courtFinished(id)
        return (
          <CourtCard
            key={id}
            courtId={id}
            rounds={state.rounds[id] ?? []}
            selected={state.selected[id] ?? -1}
            onGenerate={() => canGenerate && handleGenerate(id)}
            onSelect={(i) => handleSelect(id, i)}
            onSaveScore={(a, b) => handleSaveScore(id, a, b)}
            canGenerate={canGenerate}
            loading={state.loading[id] ?? false}
          />
        )
      })}
    </div>
  )
}
