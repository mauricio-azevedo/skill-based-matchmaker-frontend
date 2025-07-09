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
      <div className="flex w-full items-center justify-between h-8 mb-4">
        <div className="text-lg font-semibold">Setup</div>
      </div>
      <div className="flex flex-col items-start flex-1 gap-8 w-full">
        {/* Número de quadras */}
        <fieldset className="flex justify-between items-center w-full gap-4 border rounded-lg p-3">
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
        </fieldset>

        {/* Team formation */}
        <fieldset className="flex flex-col gap-4 w-full border rounded-lg p-3">
          <legend className="text-md font-medium">Duplas</legend>
          {/*<h2 className="text-md font-medium">Duplas</h2>*/}

          {/* Mode */}
          <div className={cn('flex flex-col gap-2', autoAlternate ? 'opacity-50' : 'opacity-100')}>
            <Label className="flex-col items-start">
              <span>Formação</span>
              <span className="text-xs text-muted-foreground font-normal">
                Define como as duplas são formadas com base nos níveis de seus jogadores.
              </span>
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
                  <span className="text-xs text-muted-foreground font-normal">
                    <strong>Menor</strong> diferença entre níveis <span className="text-nowrap">(5+5 vs 5+5).</span>
                  </span>
                </Label>
              </div>
              <div className="flex flex-1 items-start gap-2 border p-2 rounded-lg">
                <RadioGroupItem id={FORMATION_MODES.MIXED} value={FORMATION_MODES.MIXED} />
                <Label htmlFor={FORMATION_MODES.MIXED} className="flex-col items-start">
                  <span>Misto</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    <strong>Maior</strong> diferença entre níveis <span className="text-nowrap">(5+1 vs 5+1).</span>
                  </span>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Automatic alternation toggle */}
          <div className="flex justify-between items-center w-full gap-4">
            <Label htmlFor="auto-switch" className="flex-col items-start">
              <span>Automático</span>
              <span className="text-xs text-muted-foreground font-normal">
                Alterna automaticamente entre modos misto e homogêneo a cada nova rodada.
              </span>
            </Label>
            <Switch id="auto-switch" checked={autoAlternate} onCheckedChange={setAutoAlternate} />
          </div>
        </fieldset>
      </div>
    </React.Fragment>
  )
}

export default SetupTab
