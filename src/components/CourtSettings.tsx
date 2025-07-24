import { useState } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger } from '@/components/ui/select'
import { useCourts } from '@/context/CourtsContext'
import { useMatchManager } from '@/hooks/useMatchManager'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import type { FormationMode } from '@/types/types'
import { FORMATION_MODES } from '@/lib/formationModes'

type SelectValueType = FormationMode | 'auto'

interface SettingsProps {
  courtId: string
}

const FORMATION_OPTIONS: Array<{
  id: string
  value: SelectValueType
  label: string
  description: string
}> = [
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
  {
    id: 'auto',
    value: 'auto',
    label: 'Alternada',
    description: 'Alterna entre nivelado e misto.',
  },
]

export function CourtSettings({ courtId }: SettingsProps) {
  const { courts, updateCourt } = useCourts()
  const { generateMatchAndAddToCourt } = useMatchManager()
  const [pendingValue, setPendingValue] = useState<SelectValueType | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const court = courts.find((c) => c.id === courtId)
  if (!court) return null

  const { formationMode, autoAlternate } = court
  const selectedValue: SelectValueType = autoAlternate ? 'auto' : formationMode

  const handleChange = (value: SelectValueType) => {
    if (value === selectedValue) return
    setPendingValue(value)
    setIsDialogOpen(true)
  }

  const handleConfirm = () => {
    if (!pendingValue) return
    if (pendingValue === 'auto') {
      updateCourt(courtId, { autoAlternate: true })
    } else {
      updateCourt(courtId, { formationMode: pendingValue, autoAlternate: false })
    }
    generateMatchAndAddToCourt(courtId)
    setIsDialogOpen(false)
    setPendingValue(null)
  }

  const handleCancel = () => {
    setIsDialogOpen(false)
    setPendingValue(null)
  }

  const currentLabel = FORMATION_OPTIONS.find((o) => o.value === selectedValue)?.label ?? 'Escolha a formação'

  return (
    <>
      <div className="flex flex-col gap-2">
        <Select value={selectedValue} onValueChange={handleChange}>
          <SelectTrigger className="w-full !h-11 !ring-0 !border-border text-md">{currentLabel}</SelectTrigger>
          <SelectContent>
            {FORMATION_OPTIONS.map((opt) => (
              <SelectItem key={opt.id} value={opt.value}>
                <div className="flex flex-col">
                  <span className="!text-md">{opt.label}</span>
                  <span className="!text-sm text-muted-foreground">{opt.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ConfirmDialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && handleCancel()}
        title="Gerar nova partida?"
        description="Deseja gerar uma nova partida com a formação selecionada?"
        confirmText="Gerar nova partida"
        cancelText="Agora não"
        onConfirm={handleConfirm}
        confirmVariant="default"
      />
    </>
  )
}
