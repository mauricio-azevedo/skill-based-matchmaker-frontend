import { CourtCard } from '@/components/CourtCard'
import { usePlayTabLogic } from './usePlayTabLogic'
import { useEffect } from 'react'

/**
 * Tela principal (mobile-only):
 * • padding lateral mínimo
 * • cards em stack, ocupando 100 % da largura
 */
export function PlayTab() {
  const { rows, state, courtFinished, canGenerateGlobal, handleGenerate, handleSaveScore } = usePlayTabLogic()

  // Logando o valor de canGenerateGlobal para cada quadra
  useEffect(() => {
    console.log('canGenerateGlobal: ', canGenerateGlobal)
  }, [canGenerateGlobal])

  return (
    <div className="flex flex-col gap-3 px-2 py-3 w-full max-w-sm mx-auto overflow-hidden">
      {/* quadras */}
      <div className="flex flex-col gap-3 overflow-y-auto">
        {rows.map(({ id }) => {
          // Verificando a condição de habilitação de canGenerate

          const canGenerate = canGenerateGlobal && (state.courtMatches[id]?.match == null || courtFinished(id))

          console.log(`Quadra ${id} - match: ${state.courtMatches[id]?.match}, canGenerate =`, canGenerate)

          return (
            <CourtCard
              key={id}
              courtId={id}
              match={state.courtMatches[id]?.match ?? null}
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
