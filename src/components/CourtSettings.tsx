import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useCourts } from '@/context/CourtsContext'
import type { FormationMode } from '@/types/types'
import { FORMATION_MODES } from '@/lib/formationModes'
import { cn } from '@/lib/utils'
import { Fragment } from 'react'

type RadioValue = FormationMode | 'auto'

interface SettingsProps {
  courtId: string
}

export function CourtSettings({ courtId }: SettingsProps) {
  const { courts, updateCourt } = useCourts()
  const court = courts.find((c) => c.id === courtId)
  if (!court) return null

  const { formationMode, autoAlternate } = court
  const selectedValue: RadioValue = autoAlternate ? 'auto' : formationMode

  // Definição DRY das opções
  const radioOptions: Array<{ id: string; value: RadioValue; label: string; description: string }> = [
    {
      id: FORMATION_MODES.HOMOGENEOUS,
      value: FORMATION_MODES.HOMOGENEOUS,
      label: 'Nivelado',
      description: 'Níveis próximos (5+5 vs 5+5).',
    },
    {
      id: FORMATION_MODES.MIXED,
      value: FORMATION_MODES.MIXED,
      label: 'Misto',
      description: 'Maior diferença (5+1 vs 5+1).',
    },
    { id: 'auto', value: 'auto', label: 'Alternado', description: 'Alterna entre nivelado e misto.' },
  ]

  return (
    <div>
      <p className="text-sm font-semibold leading-tight text-center py-2 px-4 flex items-center">
        Modo de balanceamento da quadra {/*<Popover>*/}
        {/*  <PopoverTrigger asChild>*/}
        {/*    <button type="button" className="p-1 rounded-full">*/}
        {/*      <Info className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />*/}
        {/*    </button>*/}
        {/*  </PopoverTrigger>*/}
        {/*  <PopoverContent side="top" className="text-xs w-fit mr-4 py-2 px-4 leading-relaxed">*/}
        {/*    <strong>Nivelado:</strong> níveis próximos (5+5 vs 5+5).*/}
        {/*    <br />*/}
        {/*    <strong>Misto:</strong> maior diferença (5+1 vs 5+1).*/}
        {/*    <br />*/}
        {/*    <strong>Alternado:</strong> alterna entre nivelado e misto.*/}
        {/*  </PopoverContent>*/}
        {/*</Popover>*/}
      </p>
      <Separator />

      <div className="flex flex-col pl-2 gap-3">
        <RadioGroup
          value={selectedValue}
          onValueChange={(value: RadioValue) => {
            if (value === 'auto') {
              updateCourt(courtId, { autoAlternate: true })
            } else {
              updateCourt(courtId, {
                formationMode: value,
                autoAlternate: false,
              })
            }
          }}
          className="flex flex-col gap-0"
        >
          {radioOptions.map((option, idx) => (
            <Fragment key={option.id}>
              {idx > 0 && <Separator className="ml-5" />}
              <Label
                htmlFor={option.id}
                className={cn(
                  'flex items-center gap-2 leading-tight py-2',
                  selectedValue === option.value && 'border-primary',
                )}
              >
                <RadioGroupItem id={option.id} value={option.value} />
                <p>
                  <span className="leading-tight">{option.label}</span>
                  <br />
                  <span className="text-xs text-muted-foreground font-normal leading-tight">{option.description}</span>
                </p>
              </Label>
            </Fragment>
          ))}
        </RadioGroup>
      </div>
    </div>
  )
}
