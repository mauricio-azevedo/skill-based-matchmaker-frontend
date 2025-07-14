import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useCourts } from '@/context/CourtsContext'
import type { FormationMode } from '@/types/types'
import { FORMATION_MODES } from '@/lib/formationModes'
import { cn } from '@/lib/utils'

interface SettingsProps {
  courtId: string
}

export function Settings({ courtId }: SettingsProps) {
  const { courtsEntities, updateCourt } = useCourts()
  const court = courtsEntities.find((c) => c.id === courtId)
  if (!court) return null

  const { formationMode, autoAlternate } = court

  return (
    <div className="py-2">
      <p className="text-md font-semibold leading-tight text-center">Balanceamento</p>
      <Separator className="mt-1 mb-2" />

      <div className="flex flex-col pl-2 gap-4 pr-2">
        <div className={cn('flex flex-col gap-2', autoAlternate ? 'opacity-50' : 'opacity-100')}>
          <Label>Modo</Label>
          <RadioGroup
            value={formationMode}
            onValueChange={(value: FormationMode) => updateCourt(courtId, { formationMode: value })}
            disabled={autoAlternate}
            className="flex gap-2"
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
            Automático
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
    </div>
  )
}
