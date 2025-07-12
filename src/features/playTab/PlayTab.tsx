import { CourtCard } from '@/components/CourtCard'
import { usePlayTabLogic } from './usePlayTabLogic'

/**
 * Tela principal (mobile-only):
 * • padding lateral mínimo
 * • cards em stack, ocupando 100 % da largura
 */
export function PlayTab() {
  const { rows, state, courtFinished, canGenerateGlobal, handleGenerate, handleSaveScore } = usePlayTabLogic()

  return (
    <div className="flex flex-col gap-3 px-2 py-3 w-full max-w-sm mx-auto overflow-hidden">
      {/* quadras */}
      <div className="flex flex-col gap-3 overflow-y-auto">
        {rows.map(({ id }) => {
          const canGenerate = canGenerateGlobal && courtFinished(id)
          return (
            <CourtCard
              key={id}
              courtId={id}
              rounds={state.rounds[id] ?? []}
              selected={state.selected[id] ?? -1}
              onGenerate={() => canGenerate && handleGenerate(id)}
              onSaveScore={(a, b) => handleSaveScore(id, a, b)}
              canGenerate={canGenerate}
              loading={state.loading[id] ?? false}
            />
          )
        })}
      </div>
    </div>
  )
}
