import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useCourts } from '@/context/CourtsContext'
import type { FormationMode } from '@/types/types'
import { FORMATION_MODES } from '@/lib/formationModes'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Info } from 'lucide-react'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
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
    <div className="py-4">
      <p className="text-md font-semibold leading-tight text-center">Balanceamento da quadra</p>
      <Separator className="mt-4 mb-4" />

      <div className="flex flex-col pl-4 gap-4 pr-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="formation-tabs" className="flex-col items-start">
            <div className="flex items-center gap-2">
              Modo de formação
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                </TooltipTrigger>
                <TooltipContent side="top" className="text-sm">
                  <strong>Homogêneo:</strong> níveis próximos (5+5 vs 5+5).
                  <br />
                  <strong>Misto:</strong> maiores diferenças (5+1 vs 5+1).
                </TooltipContent>
              </Tooltip>
            </div>
            <span className="text-xs text-muted-foreground font-normal">
              Define a formação das duplas de acordo com o nível dos jogadores.
            </span>
          </Label>
          <RadioGroup
            value={formationMode}
            onValueChange={(value: FormationMode) => updateCourt(courtId, { formationMode: value })}
            disabled={autoAlternate}
            className={cn('flex gap-2 w-full', autoAlternate && 'opacity-40')}
          >
            <Label
              htmlFor={FORMATION_MODES.HOMOGENEOUS}
              className="flex flex-1 items-start gap-2 border p-4 rounded-lg"
            >
              <RadioGroupItem id={FORMATION_MODES.HOMOGENEOUS} value={FORMATION_MODES.HOMOGENEOUS} />
              Homogêneo
            </Label>
            <Label htmlFor={FORMATION_MODES.MIXED} className="flex flex-1 items-start gap-2 border p-4 rounded-lg">
              <RadioGroupItem id={FORMATION_MODES.MIXED} value={FORMATION_MODES.MIXED} />
              Misto
            </Label>
          </RadioGroup>
        </div>

        <Separator />

        <div className="flex justify-between items-center w-full gap-4">
          <Label htmlFor={`auto-switch-${courtId}`} className="flex-col items-start">
            Alternado Automático
            <span className="text-xs text-muted-foreground font-normal">
              Alterna automaticamente entre modos a cada nova partida.
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
