import React, { type FC } from 'react'
import { Label } from '@/components/ui/label'
import { useCourts } from '@/context/CourtsContext'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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
          <Label htmlFor="court-select" className="flex flex-col items-start">
            <span>Quadras</span>
            <span className="text-muted-foreground font-normal text-xs">Em quantas quadras você vai jogar?</span>
          </Label>
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

        {/* Variação de nível da dupla */}
        <div className="flex justify-between items-center w-full gap-2">
          <div>
            <Label className="flex-col items-start" htmlFor="variation-switch">
              <span>Duplas mistas</span>
              <span className="text-muted-foreground font-normal text-xs">Mistura níveis em cada dupla.</span>
            </Label>
          </div>
          <Switch id="variation-switch" checked={variationEnabled} onCheckedChange={setVariationEnabled} />
        </div>
      </div>
    </React.Fragment>
  )
}

export default SetupTab
