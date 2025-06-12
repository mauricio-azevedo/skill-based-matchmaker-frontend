// src/components/PlayersTab.tsx

import { useState, type FC, type FormEvent } from 'react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Label } from '@/components/ui/label'
import { usePlayers } from '@/context/PlayersContext'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

/* -------------------------------------------------------------------------- */
/*                        Animations – variants & spring                      */
/* -------------------------------------------------------------------------- */
const itemVariants = {
  initial: { opacity: 0, scale: 0.9, y: 12 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.8 },
}

const spring = { type: 'spring', stiffness: 500, damping: 38, mass: 0.9 }

/* -------------------------------------------------------------------------- */
/*                                PlayersTab                                  */
/* -------------------------------------------------------------------------- */
const PlayersTab: FC = () => {
  const { players, add, remove, toggleActive } = usePlayers()
  const [name, setName] = useState('')
  const [level, setLevel] = useState(1)

  /* ----------------------------- Handlers ---------------------------------- */
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const trimmed = name.trim()
    if (!trimmed) return

    add(trimmed, level)
    setName('')
  }

  /* ------------------------------ Render ----------------------------------- */
  return (
    <section className="container mx-auto flex h-full max-w-md flex-col gap-8 px-4 py-8">
      <Card className="flex min-h-0 flex-col">
        <CardHeader>
          <CardTitle>Jogadores</CardTitle>
        </CardHeader>

        <CardContent className="flex min-h-0 flex-col gap-6 p-6">
          {/* ----------------------------- Form -------------------------------- */}
          <form onSubmit={handleSubmit} className="flex gap-4">
            <div className="flex flex-col gap-4">
              {/* ---------------------- Player name input ---------------------- */}
              <div className="flex">
                <Label htmlFor="player-name" className="w-18">
                  Nome
                </Label>
                <Input id="player-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              {/* ------------- NEW: level picker with ToggleGroup -------------- */}
              <div className="flex">
                <Label htmlFor="player-level" className="w-18">
                  Nível
                </Label>
                {/*
                We use a **single** ToggleGroup (radio‑style) so only one level
                can be selected at a time. The chosen value is stored as a
                number in state.
              */}
                <ToggleGroup
                  size="default"
                  id="player-level"
                  type="single"
                  value={level.toString()}
                  onValueChange={(val: string) => {
                    // Ignore empty string when the same item is clicked again
                    if (val) setLevel(Number(val))
                  }}
                  className="flex flex-wrap gap-2 w-full"
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

            <Button type="submit" className="h-[88px] w-[88px]">
              Adicionar
            </Button>
          </form>

          {/* ----------------------- Scrollable list -------------------------- */}
          <ScrollArea className="min-h-0 flex-1 pr-1">
            <LayoutGroup>
              <motion.ul layout className="flex flex-col gap-3" initial={false}>
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
                      whileHover={{ scale: 1.02 }}
                      className="flex items-center justify-between rounded-lg border px-3 py-2"
                    >
                      {/* -------- Left side: name, level, toggle ---------- */}
                      <div className="flex items-center gap-4">
                        <span className="font-medium leading-none">
                          {p.name}
                          <Badge variant="secondary" className="ml-2">
                            Lv {p.level}
                          </Badge>
                        </span>
                      </div>
                      <div className="flex">
                        <div className="flex items-center gap-2">
                          <Label htmlFor={`active-${p.id}`} className="text-sm opacity-70">
                            Ativo
                          </Label>
                          <Switch id={`active-${p.id}`} checked={p.active} onCheckedChange={() => toggleActive(p.id)} />
                        </div>
                        {/* ------------------- Remove button ------------------ */}
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Remove ${p.name}`}
                          onClick={() => remove(p.id)}
                        >
                          ✕
                        </Button>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            </LayoutGroup>
          </ScrollArea>
        </CardContent>
      </Card>
    </section>
  )
}

export default PlayersTab
