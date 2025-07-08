import React, { type FC } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Minus, Plus } from 'lucide-react'
import { useCourts } from '@/context/CourtsContext'

const SetupTab: FC = () => {
  const { courts, setCourts } = useCourts()

  return (
    <React.Fragment>
      <div className="flex w-full h-8">
        <div className="text-lg font-semibold">Setup</div>
      </div>
      {/* Número de quadras */}
      <div className="flex flex-col items-start flex-1 w-full">
        <div className="flex gap-2">
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
      </div>
    </React.Fragment>
  )
}

export default SetupTab
