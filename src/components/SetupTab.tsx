import React, { type FC } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Minus, Plus } from 'lucide-react'
import { useCourts, type VariationLevel } from '@/context/CourtsContext'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

const SetupTab: FC = () => {
  const { courts, setCourts, variation, setVariation } = useCourts()

  function handleVariationChange(value: string) {
    setVariation(value as VariationLevel)
  }

  return (
    <React.Fragment>
      <div className="flex w-full items-center justify-between h-8">
        <div className="text-lg font-semibold">Setup</div>
      </div>
      <div className="flex flex-col items-start flex-1 gap-6 w-full">
        {/* Número de quadras */}
        <div className="flex gap-2 justify-between w-full">
          <Label htmlFor="court-count">Número de quadras</Label>
          <div className="flex items-center gap-1">
            {/* Botão de diminuir */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onMouseDown={(e) => e.preventDefault()} // mantém o foco atual
              onClick={() => setCourts((prev) => Math.max(1, prev - 1))}
              aria-label="Diminuir número de quadras"
              className="h-8 w-8"
            >
              <Minus className="!h-3 !w-3" />
            </Button>

            {/* Campo numérico (também permite digitação direta) */}
            <Input
              id="court-count"
              type="number"
              min={1}
              value={courts}
              onChange={(e) => setCourts(Math.max(1, Number(e.target.value)))}
              readOnly
              tabIndex={-1}
              className="w-12 text-center cursor-default select-none pointer-events-none text-xs h-8"
            />

            {/* Botão de aumentar */}
            <Button
              type="button"
              variant="outline"
              size="icon"
              onMouseDown={(e) => e.preventDefault()} // mantém o foco atual
              onClick={() => setCourts((prev) => prev + 1)}
              aria-label="Aumentar número de quadras"
              className="h-8 w-8"
            >
              <Plus className="!h-3 !w-3" />
            </Button>
          </div>
        </div>

        {/* Variação de nível da dupla */}
        <div className="flex gap-2 justify-between w-full">
          <Label>Variação de nível da dupla</Label>
          <RadioGroup
            value={variation}
            onValueChange={handleVariationChange}
            name="variation-level"
            className="flex items-center gap-4"
          >
            <div className="flex items-center gap-1">
              <RadioGroupItem value="low" id="variation-low" />
              <Label htmlFor="variation-low">Baixa</Label>
            </div>
            <div className="flex items-center gap-1">
              <RadioGroupItem value="high" id="variation-high" />
              <Label htmlFor="variation-high">Alta</Label>
            </div>
          </RadioGroup>
        </div>
      </div>
    </React.Fragment>
  )
}

export default SetupTab
