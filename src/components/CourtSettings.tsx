import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCourts } from '@/context/CourtsContext'
import type { FormationMode } from '@/types/types'
import { FORMATION_MODES } from '@/lib/formationModes'
import { cn } from '@/lib/utils'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Info } from 'lucide-react'

type RadioValue = FormationMode | 'auto'

interface SettingsProps {
  courtId: string
}

export function CourtSettings({ courtId }: SettingsProps) {
  const { courts, updateCourt } = useCourts()
  const court = courts.find((c) => c.id === courtId)
  if (!court) return null

  const { formationMode, autoAlternate } = court

  // Valor atual do RadioGroup:
  const selectedValue: RadioValue = autoAlternate ? 'auto' : formationMode

  return (
    <div>
      <p className="text-sm font-semibold leading-tight text-center py-2 px-4 flex items-center">
        Modo de balanceamento da quadra{' '}
        <Popover>
          <PopoverTrigger asChild>
            <button type="button" className="p-1 rounded-full">
              <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" className="text-xs w-fit mr-4">
            <strong>Nivelado:</strong> níveis próximos (5+5 vs 5+5).
            <br />
            <strong>Misto:</strong> maior diferença (5+1 vs 5+1).
            <br />
            <strong>Alternado:</strong> alterna entre nivelado e misto.
          </PopoverContent>
        </Popover>
      </p>
      <Separator />

      <div className="flex flex-col pl-2 gap-3">
        <div className="flex flex-col gap-2">
          {/*<Label htmlFor="formation-tabs" className="flex-col items-start">*/}
          {/*  <div className="flex items-center gap-2">*/}
          {/*    Modo de formação*/}

          {/*  </div>*/}
          {/*  <span className="text-xs text-muted-foreground font-normal">*/}
          {/*    Define a formação das duplas de acordo com o nível dos jogadores.*/}
          {/*  </span>*/}
          {/*</Label>*/}

          <RadioGroup
            // agora inclui 'auto' como valor possível
            value={selectedValue}
            onValueChange={(value: RadioValue) => {
              if (value === 'auto') {
                // quando "Alternado Automático" for selecionado, ativamos o booleano
                updateCourt(courtId, { autoAlternate: true })
              } else {
                // ao escolher um modo fixo, desativamos o auto-alternate e mudamos o formationMode
                updateCourt(courtId, {
                  formationMode: value,
                  autoAlternate: false,
                })
              }
            }}
            className="flex flex-col gap-0"
          >
            <Label
              htmlFor={FORMATION_MODES.HOMOGENEOUS}
              className={cn(
                'flex items-start gap-2 leading-tight py-3',
                selectedValue === FORMATION_MODES.HOMOGENEOUS && 'border-primary',
              )}
            >
              <RadioGroupItem id={FORMATION_MODES.HOMOGENEOUS} value={FORMATION_MODES.HOMOGENEOUS} />
              Nivelado
            </Label>

            <Separator className="ml-5" />

            <Label
              htmlFor={FORMATION_MODES.MIXED}
              className={cn(
                'flex items-start gap-2 leading-tight py-3',
                selectedValue === FORMATION_MODES.MIXED && 'border-primary',
              )}
            >
              <RadioGroupItem id={FORMATION_MODES.MIXED} value={FORMATION_MODES.MIXED} />
              Misto
            </Label>

            <Separator className="ml-5" />

            <Label
              htmlFor="auto-alternate"
              className={cn('flex items-start gap-2 leading-tight py-3', selectedValue === 'auto' && 'border-primary')}
            >
              <RadioGroupItem id="auto-alternate" value="auto" />
              Alternado
            </Label>
          </RadioGroup>
        </div>
      </div>
    </div>
  )
}
