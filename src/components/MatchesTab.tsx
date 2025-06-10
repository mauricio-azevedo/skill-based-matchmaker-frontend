// ============================================================================
// src/components/MatchesTab.tsx – Interface de geração de partidas
// ============================================================================
import React, { useEffect, useState } from 'react'
import { usePlayers } from '../context/PlayersContext'
import type { Player } from '../context/PlayersContext'
import { generateMatches, type PlayedMap, type Match } from '../lib/algorithm'

// ---------------------------------------------------------------------------
// Componente principal que mostra controles + lista de partidas.
// Regra de negócio‑chave: Sempre que houver jogadores suficientes, gera
// partidas equilibradas, priorizando quem jogou menos vezes.
// ---------------------------------------------------------------------------
const MatchesTab: React.FC = () => {
  // players – array reativo vindo do contexto global.  Qualquer inserção /
  // remoção em PlayersProvider dispara rerender aqui.
  const { players } = usePlayers()

  // teamSize – tamanho de cada time (valor padrão 2).  Controlado por <input>.
  const [teamSize, setTeamSize] = useState(2)
  // played – mapa id → nº de partidas disputadas.  Mantido localmente para
  // que a UX se lembre da contagem mesmo se o usuário alternar de aba.
  const [played, setPlayed] = useState<PlayedMap>({})
  // matches – lista de partidas geradas pela última chamada a generate().
  const [matches, setMatches] = useState<Match[]>([])

  // Saída de depuração para checagem rápida no DevTools.
  console.log(players, played)

  // -------------------------------------------------------------------------
  // generate() encapsula a regra de negócio pesada importada de algorithm.ts.
  // - Copiamos played (spread) para evitar side‑effects.
  // - Recebemos de volta lista de partidas + novo mapa played, já incrementado.
  // -------------------------------------------------------------------------
  const generate = () => {
    const { matches: m, played: p } = generateMatches(players, teamSize, { ...played })
    setMatches(m) // atualiza lista na UI
    setPlayed(p) // persiste progresso para próximos sorteios
  }

  // -------------------------------------------------------------------------
  // Efeito que roda:
  //   • na primeira montagem do componente, e
  //   • toda vez que a lista de players muda (adição/remoção).
  // Gera automaticamente se há pelo menos jogadores para 2 times completos.
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (players.length >= teamSize * 2) generate()
    // teamSize NÃO é dependência: usuário pode alterar manualmente ‑> botão.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [players])

  // -------------------------------------------------------------------------
  // Renderização declarativa com Tailwind / DaisyUI:
  //   1. Painel de controles (input numeric + botão)
  //   2. Feedback "No matches" caso não dê para montar nenhum confronto
  //   3. <ol> de partidas, cada uma com Team A vs Team B.
  // -------------------------------------------------------------------------
  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      {/* ---------- CONTROLES ---------- */}
      <div className="flex items-center space-x-2">
        <label className="label">Team size</label>
        {/* Input controlado; limita de 1 a 10 para evitar seleções absurdas */}
        <input
          type="number"
          min={1}
          max={10}
          value={teamSize}
          onChange={(e) => setTeamSize(Number(e.target.value))}
          className="input input-bordered w-24"
        />
        {/* Disable se jogadores < playersNecessários = teamSize * 2 */}
        <button className="btn btn-primary" onClick={generate} disabled={players.length < teamSize * 2}>
          Generate
        </button>
      </div>

      {/* ---------- FEEDBACK ---------- */}
      {matches.length === 0 && <p>No matches possible ⚠️</p>}

      {/* ---------- LISTA DE PARTIDAS ---------- */}
      <ol className="space-y-4">
        {matches.map((m, idx) => (
          <li key={idx} className="border rounded p-4">
            <div className="flex justify-between">
              <TeamView title="Team A" team={m.teamA} />
              <span className="text-xl font-bold self-center">vs</span>
              <TeamView title="Team B" team={m.teamB} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  )
}

// ---------------------------------------------------------------------------
// TeamView – componente presentational (stateless) que formata um time.
// Recebe props { title, team } e devolve lista <li> com badge de nível.
// ---------------------------------------------------------------------------
const TeamView: React.FC<{ title: string; team: Player[] }> = ({ title, team }) => (
  <div>
    <h3 className="font-semibold mb-1">{title}</h3>
    <ul>
      {team.map((p) => (
        <li key={p.id}>
          {p.name} <span className="badge ml-1">Lv {p.level}</span>
        </li>
      ))}
    </ul>
  </div>
)

export default MatchesTab
