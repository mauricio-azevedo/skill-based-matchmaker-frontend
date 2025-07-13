import { Button } from '@/components/ui/button'
import { useCourts } from '@/context/CourtsContext'

/**
 * CourtList component: shows all courts with controls to add and delete courts.
 */
export function CourtList() {
  const { courts, addCourt, deleteCourt } = useCourts()
  const courtEntries = Object.values(courts)

  const handleAdd = () => {
    addCourt()
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium">Quadras ({courtEntries.length})</span>
        <Button size="sm" onClick={handleAdd}>
          Adicionar quadra
        </Button>
      </div>

      {courtEntries.length > 0 ? (
        <ul className="space-y-2">
          {courtEntries.map((court, index) => (
            <li key={court.id} className="flex justify-between items-center p-2 border rounded-md">
              <span className="text-sm">Quadra {index + 1}</span>
              <Button size="sm" variant="destructive" onClick={() => deleteCourt(court.id)}>
                Excluir
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Nenhuma quadra adicionada.</p>
      )}
    </div>
  )
}
