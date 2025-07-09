import React, { type FC } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Minus, Plus } from 'lucide-react'
import { useCourts } from '@/context/CourtsContext'
import { Switch } from '@/components/ui/switch'

const SetupTab: FC = () => {
  const { courts, setCourts, variationEnabled, setVariationEnabled } = useCourts()

  return (
    <React.Fragment>
      <div className="flex w-full items-center justify-between h-8 mb-2">
        <div className="text-lg font-semibold">Setup</div>
      </div>
      <div className="flex flex-col items-start flex-1 gap-4 w-full">
        {/* Número de quadras */}
        <div className="flex gap-2 justify-between w-full">
          <Label htmlFor="court-count" className="flex flex-col items-start">
            <span>Quadras</span>
            <span className="text-muted-foreground leading-snug font-normal text-xs">
              Em quantas quadras você vai jogar?
            </span>
          </Label>
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
        <div className="flex justify-between items-center w-full gap-2">
          <div>
            <Label className="flex-col items-start" htmlFor="variation-switch">
              <span>Duplas mistas</span>
              <span className="text-muted-foreground leading-snug font-normal text-xs">
                Mistura níveis em cada dupla.
              </span>
            </Label>
          </div>
          <Switch id="variation-switch" checked={variationEnabled} onCheckedChange={setVariationEnabled} />
        </div>
      </div>
    </React.Fragment>
  )
}

export default SetupTab
