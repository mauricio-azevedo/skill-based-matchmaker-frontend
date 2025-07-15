import { Label } from '@/components/ui/label'
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
      label: 'Nivelada',
      description: 'Níveis próximos (5+5 vs 5+5).',
    },
    {
      id: FORMATION_MODES.MIXED,
      value: FORMATION_MODES.MIXED,
      label: 'Mista',
      description: 'Maior diferença (5+1 vs 5+1).',
    },
    { id: 'auto', value: 'auto', label: 'Alternada', description: 'Alterna entre nivelado e misto.' },
  ]

  return (
    <div className="flex flex-col gap-2 p-1">
      <div className="flex flex-col gap-3">
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
          className="flex flex-col gap-1"
        >
          {radioOptions.map((option) => (
            <Fragment key={option.id}>
              <Label
                htmlFor={option.id}
                className={cn(
                  'flex flex-col items-start gap-1 leading-tight py-1 px-2 rounded-sm',
                  selectedValue === option.value && 'bg-neutral-800',
                )}
              >
                <div className="flex w-full items-center">
                  <RadioGroupItem className="w-2 h-2 mr-2" id={option.id} value={option.value} />
                  <p className="leading-tight">{option.label}</p>
                </div>

                <p className="text-xs text-muted-foreground font-normal leading-tight ml-4">{option.description}</p>
              </Label>
            </Fragment>
          ))}
        </RadioGroup>
      </div>
    </div>
  )
}
