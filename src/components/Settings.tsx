import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useCourts } from '@/context/CourtsContext'
import type { FormationMode } from '@/types/types'
import { FORMATION_MODES } from '@/lib/formationModes'

interface SettingsProps {
  courtId: string
}

export function Settings({ courtId }: SettingsProps) {
  const { courtsEntities, updateCourt } = useCourts()
  const court = courtsEntities.find((c) => c.id === courtId)
  if (!court) return null

  const { formationMode, autoAlternate } = court

  return (
    <div className="flex flex-col w-full">
      <h2 className="text-lg font-semibold pl-4">Configurações da Quadra</h2>
      <Separator className="mt-2 mb-4" />

      <h2 className="text-md font-medium">Duplas</h2>
      <Separator className="mt-2 mb-4" />

      <div className={cn('flex flex-col gap-2 mb-4', autoAlternate ? 'opacity-50' : 'opacity-100')}>
        <Label className="flex-col items-start">
          <span>Formação</span>
          <span className="text-xs text-muted-foreground font-normal">
            Define como as duplas são formadas com base nos níveis de seus jogadores.
          </span>
        </Label>
        <RadioGroup
          value={formationMode}
          onValueChange={(value: FormationMode) => updateCourt(courtId, { formationMode: value })}
          disabled={autoAlternate}
          className="flex"
        >
          <div className="flex flex-1 items-start gap-2 border p-2 rounded-lg">
            <RadioGroupItem id={FORMATION_MODES.HOMOGENEOUS} value={FORMATION_MODES.HOMOGENEOUS} />
            <Label htmlFor={FORMATION_MODES.HOMOGENEOUS} className="flex-col items-start">
              <span>Homogêneo</span>
              <span className="text-xs text-muted-foreground font-normal">
                <strong>Menor</strong> diferença entre níveis (5+5 vs 5+5).
              </span>
            </Label>
          </div>
          <div className="flex flex-1 items-start gap-2 border p-2 rounded-lg">
            <RadioGroupItem id={FORMATION_MODES.MIXED} value={FORMATION_MODES.MIXED} />
            <Label htmlFor={FORMATION_MODES.MIXED} className="flex-col items-start">
              <span>Misto</span>
              <span className="text-xs text-muted-foreground font-normal">
                <strong>Maior</strong> diferença entre níveis (5+1 vs 5+1).
              </span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex justify-between items-center w-full gap-4">
        <Label htmlFor={`auto-switch-${courtId}`} className="flex-col items-start">
          <span>Automático</span>
          <span className="text-xs text-muted-foreground font-normal">
            Alterna automaticamente entre modos misto e homogêneo a cada nova rodada.
          </span>
        </Label>
        <Switch
          id={`auto-switch-${courtId}`}
          checked={autoAlternate}
          onCheckedChange={(checked) => updateCourt(courtId, { autoAlternate: checked })}
        />
      </div>
    </div>
  )
}
