// src/components/PlayersTab.tsx
import { useState, type FC, type FormEvent } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { usePlayers } from '@/context/PlayersContext'
import EditPlayerModal from './EditPlayerModal'
import { Plus } from 'lucide-react'

const itemVariants = {
  initial: { opacity: 0, scale: 0.9, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.8 },
}
const spring = { type: 'spring', stiffness: 500, damping: 38, mass: 0.9 }

const PlayersTab: FC = () => {
  const { players, add, toggleActive } = usePlayers()
  const [name, setName] = useState('')
  const [level, setLevel] = useState(1)

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    add(trimmed, level)
    setName('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Jogadores</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Lista de jogadores */}
        <ScrollArea className="min-h-0 flex-1" type="scroll">
          <LayoutGroup>
            <motion.ul layout initial={false} className="flex flex-col gap-3 flex-1">
              <AnimatePresence initial={false}>
                {players.map((p) => (
                  <motion.li
                    key={p.id}
                    layout="position"
                    variants={itemVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={spring}
                    className="flex items-center"
                  >
                    {/* cartão interno */}
                    <div className="flex-1 flex items-center justify-between rounded-lg border px-3 py-2">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center">
                          <p className="font-medium text-sm">{p.name}</p>
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Nív. {p.level}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch id={`active-${p.id}`} checked={p.active} onCheckedChange={() => toggleActive(p.id)} />
                      </div>
                    </div>
                    {/* trigger do modal de edição */}
                    <EditPlayerModal player={p} />
                  </motion.li>
                ))}
              </AnimatePresence>
            </motion.ul>
          </LayoutGroup>
        </ScrollArea>

        {/* Formulário de adição */}
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <div className="flex flex-col gap-2">
            <div className="flex gap-2 flex-1">
              <Label htmlFor="player-name" className="w-[2.5rem]">
                Nome
              </Label>
              <Input id="player-name" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="flex gap-2 flex-1">
              <Label htmlFor="player-level" className="w-[2.5rem]">
                Nível
              </Label>
              <ToggleGroup
                id="player-level"
                type="single"
                value={level.toString()}
                onValueChange={(val: string) => val && setLevel(Number(val))}
                className="flex flex-wrap gap-2 flex-1"
              >
                {Array.from({ length: 5 }, (_, i) => i + 1).map((lvl) => (
                  <ToggleGroupItem
                    key={lvl}
                    value={lvl.toString()}
                    aria-label={`Level ${lvl}`}
                    className="w-8 justify-center"
                  >
                    {lvl}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>

          <Button size="icon" className="rounded-full">
            <Plus className="h-4 w-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default PlayersTab
