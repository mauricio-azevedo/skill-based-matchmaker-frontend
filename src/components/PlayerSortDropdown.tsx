import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ArrowDownWideNarrow } from 'lucide-react'
import React from 'react'

type SortBy = 'active' | 'name' | 'level'
type Props = {
  sortBy: SortBy
  setSortBy: (val: SortBy) => void
}

const LABELS = {
  name: 'Nome',
  level: 'Nível',
  active: 'Ativos',
}

const PlayerSortDropdown: React.FC<Props> = ({ sortBy, setSortBy }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm" className="flex items-center gap-2 text-sm !p-1">
        <ArrowDownWideNarrow className="h-4 w-4 text-muted-foreground" />
        {LABELS[sortBy]}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start">
      {(['name', 'level', 'active'] as SortBy[]).map((option) => (
        <DropdownMenuCheckboxItem
          key={option}
          checked={sortBy === option}
          onCheckedChange={() => setSortBy(option)}
          className="flex items-center gap-2"
        >
          {LABELS[option]}
        </DropdownMenuCheckboxItem>
      ))}
    </DropdownMenuContent>
  </DropdownMenu>
)

export default PlayerSortDropdown
