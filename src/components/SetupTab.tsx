import React, { type FC } from 'react'
import { Label } from '@/components/ui/label'
import { type FormationMode, useCourts } from '@/context/CourtsContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FORMATION_MODES } from '@/context/FORMATION_MODES'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const SetupTab: FC = () => {
  const { courts, setCourts, formationMode, setFormationMode, autoAlternate, setAutoAlternate } = useCourts()

  return (
    <React.Fragment>
      <div className="flex w-full items-center justify-between h-8 mb-2">
        <div className="text-lg font-semibold">Setup</div>
      </div>
      <div className="flex flex-col items-start flex-1 gap-6 w-full">
        {/* Número de quadras */}
        <div className="flex justify-between items-center w-full gap-4">
          <Label htmlFor="court-select" className="flex-col items-start flex-1">
            <span>Quadras</span>
            <span className="text-muted-foreground font-normal text-xs">Quantidade de quadras disponíveis.</span>
          </Label>
          <div className="flex w-16 justify-end">
            <Select value={String(courts)} onValueChange={(value: string) => setCourts(Number(value))}>
              <SelectTrigger className="w-16">
                <SelectValue placeholder="Selecione número de quadras" />
              </SelectTrigger>
              <SelectContent className="w-12">
                {[1, 2, 3, 4].map((num) => (
                  <SelectItem key={num} value={String(num)}>
                    {num}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Team formation */}
        <div className="flex flex-col gap-4 w-full">
          <h2 className="text-md font-medium">Formação de duplas</h2>

          {/* Mode */}
          <div className={cn('flex flex-col gap-2', autoAlternate ? 'opacity-50' : 'opacity-100')}>
            <Label className="flex-col items-start">
              <span>Modo de formação</span>
              <span className="text-xs text-muted-foreground">Diferença entre níveis em cada dupla.</span>
            </Label>
            <RadioGroup
              value={formationMode}
              onValueChange={(value: FormationMode) => setFormationMode(value)}
              disabled={autoAlternate}
              className="flex"
            >
              <div className="flex flex-1 items-start gap-2 border p-2 rounded-lg">
                <RadioGroupItem id={FORMATION_MODES.HOMOGENEOUS} value={FORMATION_MODES.HOMOGENEOUS} />
                <Label htmlFor={FORMATION_MODES.HOMOGENEOUS} className="flex-col items-start">
                  <span>Homogêneo</span>
                  <span className="text-xs text-muted-foreground">
                    Menor diferença
                    <br />
                    5+5 vs 5+5; 1+1 vs 1+1.
                  </span>
                </Label>
              </div>
              <div className="flex flex-1 items-start gap-2 border p-2 rounded-lg">
                <RadioGroupItem id={FORMATION_MODES.MIXED} value={FORMATION_MODES.MIXED} />
                <Label htmlFor={FORMATION_MODES.MIXED} className="flex-col items-start">
                  <span>Misto</span>
                  <span className="text-xs text-muted-foreground">
                    Maior diferença
                    <br />
                    5+1 vs 5+1; 5+1 vs 5+1.
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Automatic alternation toggle */}
          <div className="flex justify-between items-center w-full">
            <Label htmlFor="auto-switch" className="flex-col items-start">
              <span>Modo automático</span>
              <span className="text-xs text-muted-foreground">Intercala uma rodada em cada modo.</span>
            </Label>
            <Switch id="auto-switch" checked={autoAlternate} onCheckedChange={setAutoAlternate} />
          </div>
        </div>
      </div>
    </React.Fragment>
  )
}

export default SetupTab
