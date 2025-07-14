import { cn } from '@/lib/utils'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { FORMATION_MODES, type FormationMode } from '@/types/entities'
import { Switch } from '@/components/ui/switch'
import { useFormationMode } from '@/context/FormationModeContext'

export function Settings() {
  const { formationMode, setFormationMode, autoAlternate, setAutoAlternate } = useFormationMode()

  return (
    <div className="flex flex-col w-full px-4">
      <h2 className="text-md font-medium mb-6">Duplas</h2>

      <div className={cn('flex flex-col gap-2 mb-4', autoAlternate ? 'opacity-50' : 'opacity-100')}>
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
                <strong>Menor</strong> diferença entre níveis (5+5 vs 5+5).
              </span>
            </Label>
          </div>
          <div className="flex flex-1 items-start gap-2 border p-2 rounded-lg">
            <RadioGroupItem id={FORMATION_MODES.MIXED} value={FORMATION_MODES.MIXED} />
            <Label htmlFor={FORMATION_MODES.MIXED} className="flex-col items-start">
              <span>Misto</span>
              <span className="text-xs text-muted-foreground font-normal">
                <strong>Maior</strong> diferença entre níveis (5+1 vs 5+1).
              </span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      <div className="flex justify-between items-center w-full gap-4">
        <Label htmlFor="auto-switch" className="flex-col items-start">
          <span>Automático</span>
          <span className="text-xs text-muted-foreground font-normal">
            Alterna automaticamente entre modos misto e homogêneo a cada nova rodada.
          </span>
        </Label>
        <Switch id="auto-switch" checked={autoAlternate} onCheckedChange={setAutoAlternate} />
      </div>
    </div>
  )
}
