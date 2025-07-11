import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'

import { useCourts } from '@/context/CourtsContext'
import { type CourtRow, ensureCourtsTable, readAllCourts } from '@/storage/courtsStorage'

// shadcn/ui
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function PlayTab() {
  const { courts, setCourts } = useCourts()
  const [rows, setRows] = useState<CourtRow[]>(() => readAllCourts())

  /** Sincroniza a “tabela” sempre que o total de quadras muda */
  useEffect(() => {
    ensureCourtsTable(courts)
    setRows(readAllCourts())
  }, [courts])

  /** Handler para adicionar uma nova quadra */
  const handleAddCourt = () => setCourts((prev) => prev + 1)

  return (
    <div className="flex flex-col gap-4">
      {/* Barra de ações */}
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2" onClick={handleAddCourt}>
          <Plus size={16} />
          Adicionar quadra
        </Button>
      </div>

      {/* Lista de quadras persistidas */}
      {rows.map(({ id }) => (
        <Card key={id} aria-label={`Quadra ${id}`}>
          <CardHeader>
            <CardTitle>Quadra {id}</CardTitle>
          </CardHeader>
          <CardContent>{/* Conteúdo específico da quadra vai aqui */}</CardContent>
        </Card>
      ))}
    </div>
  )
}
