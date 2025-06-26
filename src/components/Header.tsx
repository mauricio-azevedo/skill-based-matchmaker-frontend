// src/components/Header.tsx
import { useEffect, useMemo, useState } from 'react'
import { Moon, Settings, Sun } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/context/AuthContext'
import { useRounds } from '@/context/RoundsContext'
import { usePlayers } from '@/context/PlayersContext'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { seedPlayers } from '@/data/seedPlayers'
import { shuffle } from '@/utils/shuffle'
import { singleToastSuccess } from '@/utils/singleToast'

export default function Header() {
  const { token, logout } = useAuth()

  /* hooks p/ estadísticas — ok mesmo se lista vazia */
  const { rounds, clear: clearRounds } = useRounds()
  const { players, updatePlayers } = usePlayers()

  /* tema ------------------------------------------------------------------ */
  const [theme, setTheme] = useState<'light' | 'dark'>('dark')
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  /* diálogos -------------------------------------------------------------- */
  const [warning, setWarning] = useState<null | 'rounds' | 'all' | 'seed'>(null)

  const isSeedLoaded = useMemo(() => {
    if (players.length !== seedPlayers.length) return false
    const set = new Set(seedPlayers.map((s) => `${s.id}-${s.name}-${s.level}`))
    return players.every((p) => set.has(`${p.id}-${p.name}-${p.level}`))
  }, [players])

  const hasRounds = rounds.length > 0
  const hasPlayers = players.length > 0
  const noData = !hasRounds && !hasPlayers

  const handleClearRounds = () => {
    clearRounds()
    updatePlayers((prev) => prev.map((pl) => ({ ...pl, matchCount: 0 })))
    singleToastSuccess('Todas as partidas apagadas!', { duration: 3000 })
  }

  const handleClearAll = () => {
    clearRounds()
    updatePlayers(() => [])
    singleToastSuccess('Todos os dados apagados!', { duration: 3000 })
  }

  const handleLoadSeed = () => {
    shuffle(seedPlayers)
    clearRounds()
    updatePlayers(() => seedPlayers)
  }

  return (
    <header className="flex items-center border-b px-4 py-2">
      <h1 className="text-xl font-semibold tracking-tight">BeachRank</h1>

      <div className="ml-auto flex items-center gap-4">
        {/* Tema */}
        <div className="flex items-center gap-2">
          <Sun className="h-4 w-4" style={{ opacity: theme === 'light' ? 1 : 0.35 }} />
          <Switch checked={theme === 'dark'} onCheckedChange={(c) => setTheme(c ? 'dark' : 'light')} />
          <Moon className="h-4 w-4" style={{ opacity: theme === 'dark' ? 1 : 0.25 }} />
        </div>

        {/* Configurações e Logout — só se logado */}
        {token && (
          <>
            {/* Menu ------------------------------------ */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-md p-2 hover:bg-muted" aria-label="Configurações">
                  <Settings className="h-4 w-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem disabled={isSeedLoaded} onSelect={() => setWarning('seed')}>
                  Inicializar jogadores
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!hasRounds}
                  className="text-destructive"
                  onSelect={() => setWarning('rounds')}
                >
                  Limpar partidas
                </DropdownMenuItem>
                <DropdownMenuItem disabled={noData} className="text-destructive" onSelect={() => setWarning('all')}>
                  Limpar tudo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Logout */}
            <button onClick={logout} className="text-sm underline">
              Sair
            </button>

            {/* ConfirmDialogs (condicionais) ----------- */}
            <ConfirmDialog
              open={warning === 'seed'}
              onOpenChange={() => setWarning(null)}
              title="Inicializar jogadores?"
              description="Isso apaga dados atuais e carrega o seed."
              confirmText="Sim, inicializar"
              onConfirm={() => {
                handleLoadSeed()
                setWarning(null)
              }}
            />
            <ConfirmDialog
              open={warning === 'rounds'}
              onOpenChange={() => setWarning(null)}
              title="Limpar partidas?"
              description="Apaga todas as partidas registradas."
              confirmVariant="destructive"
              confirmText="Sim, limpar"
              onConfirm={() => {
                handleClearRounds()
                setWarning(null)
              }}
            />
            <ConfirmDialog
              open={warning === 'all'}
              onOpenChange={() => setWarning(null)}
              title="Limpar todos os dados?"
              description="Remove jogadores e partidas de forma permanente."
              confirmVariant="destructive"
              confirmText="Sim, limpar tudo"
              onConfirm={() => {
                handleClearAll()
                setWarning(null)
              }}
            />
          </>
        )}
      </div>
    </header>
  )
}
