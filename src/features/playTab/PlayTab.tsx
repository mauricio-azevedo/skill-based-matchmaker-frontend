import { Plus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { CourtCard } from '@/components/CourtCard'
import { usePlayTabLogic } from './usePlayTabLogic'

export function PlayTab() {
  const {
    rows,
    state,
    canGenerate: canGenerateGlobal,
    handleAddCourt,
    handleGenerate,
    handleSelect,
    handleSaveScore,
  } = usePlayTabLogic()

  /* função utilitária: verifica se TODAS as partidas da quadra têm placar */
  const courtFinished = (courtId: number) =>
    (state.rounds[courtId] ?? []).every((r) => r.matches[0].gamesA !== null && r.matches[0].gamesB !== null)

  return (
    <div className="flex flex-col gap-4">
      {/* Barra global de ações */}
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2" onClick={handleAddCourt}>
          <Plus size={16} /> Adicionar quadra
        </Button>
      </div>

      {/* Lista de quadras */}
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
