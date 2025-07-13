import { useCourts } from '@/context/CourtsContext'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'

/**
 * CourtList: mostra o número de quadras e permite selecionar de 1 a 6.
 */
export function CourtList() {
  const { courts, setCourts } = useCourts()

  return (
    <div className="flex justify-between items-center mb-2">
      <Label className="flex-col items-start">
        <span>Quadras</span>
        <span className="text-xs text-muted-foreground font-normal">Quantidade de quadras disponíveis.</span>
      </Label>
      <Select value={courts.toString()} onValueChange={(value) => setCourts(Number(value))}>
        <SelectTrigger className="w-[80px]">
          <SelectValue placeholder="Selecione" />
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3, 4, 5, 6].map((num) => (
            <SelectItem key={num} value={num.toString()}>
              {num}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
