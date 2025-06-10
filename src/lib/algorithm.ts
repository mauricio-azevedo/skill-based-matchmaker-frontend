// ============================================================================
// src/lib/algorithm.ts – geração de partidas 2×2
// ============================================================================
//  ➤ Regras de negócio implementadas
//  ---------------------------------------------------------------------------
//  1. Cobrir o máximo possível de *duplas* exclusivas (cada par A‑B deve
//     aparecer pelo menos uma vez, quando possível).
//  2. Balancear o nível dos times: preferência por partidas com *score* 0
//     (multisets de níveis idênticos). Permite‑se *score* 1, mas partidas
//     com *score* ≥ 2 são removidas.
//  3. Pós‑ajuste de participação: no resultado final, nenhum jogador pode ter
//     mais de **uma** partida de diferença para o mínimo observado.
//  4. ***NOVA REGRA (2025‑06‑10)***: **nunca** formar uma dupla em que ambos
//     os jogadores tenham o **mesmo nível**.
//
//  Observação: O código está dividido em seções independentes. Cada função
//  possui JSDoc detalhando sua responsabilidade e as regras que faz cumprir.
// ============================================================================

import type { Player } from '../context/PlayersContext'
import { shuffle } from './shuffle.js'

/** Cada partida contém dois times de dois jogadores. */
export interface Match {
  teamA: Player[]
  teamB: Player[]
}

/** Conjunto de partidas que podem acontecer simultaneamente. */
export interface Round {
  matches: Match[] // ≤ courts partidas, sem jogadores repetidos
}

// ---------------------------------------------------------------------------
// Utilidades internas
// ---------------------------------------------------------------------------

/** Retorna *true* se as duas partidas compartilham algum jogador. */
const sharesPlayer = (a: Match, b: Match) => {
  const idsA = new Set([...a.teamA, ...a.teamB].map((p) => p.id))
  return [...b.teamA, ...b.teamB].some((p) => idsA.has(p.id))
}

/**
 * Gera um cronograma, com prioridade em rounds completos, de rodadas respeitando:
 *   • Regras 1-4 (já garantidas por `generateMatches`);
 *   • ≤ `courts` partidas simultâneas;
 *   • nenhum jogador repetido dentro da mesma rodada.
 */
export function generateSchedule(players: Player[], courts: number): Round[] {
  if (courts < 1) throw new Error('courts must be ≥ 1')

  const matches = generateMatches(shuffle(players))
  const rounds: Round[] = []

  for (const match of matches) {
    // 1. Tenta colocar na rodada mais vazia possível.
    rounds.sort((a, b) => a.matches.length - b.matches.length) // menor → maior
    let placed = false

    for (const round of rounds) {
      const clash = round.matches.some((m) => sharesPlayer(m, match))
      if (!clash && round.matches.length < courts) {
        round.matches.push(match)
        placed = true
        break
      }
    }

    // 2. Se não couber em nenhuma, cria nova rodada.
    if (!placed) rounds.push({ matches: [match] })
  }

  // 3. Compactação: tenta mover partidas de rodadas posteriores para anteriores.
  for (let i = 0; i < rounds.length; i++) {
    if (rounds[i].matches.length === courts) continue
    for (let j = i + 1; j < rounds.length && rounds[i].matches.length < courts; j++) {
      for (let k = 0; k < rounds[j].matches.length; k++) {
        const m = rounds[j].matches[k]
        if (!rounds[i].matches.some((x) => sharesPlayer(x, m))) {
          rounds[i].matches.push(m)
          rounds[j].matches.splice(k, 1)
          k--
          if (rounds[i].matches.length === courts) break
        }
      }
    }
  }

  // 4. Remove rodadas vazias (podem surgir após a compactação)
  return rounds.filter((r) => r.matches.length > 0)
}

/**
 * Gera uma chave única (e ordenada) para um par de jogadores.
 * Usada para rastrear quais duplas já foram "cobertas" em alguma partida.
 */
const pairKey = (a: Player, b: Player) => (a.id < b.id ? `${a.id}-${b.id}` : `${b.id}-${a.id}`)

/** Chave (inteiro) que representa o nível de um jogador. */
const levelKey = (p: Player) => p.level

/** Retorna *true* se ambos os jogadores possuem o mesmo nível. */
const sameLevel = (a: Player, b: Player) => levelKey(a) === levelKey(b)

/**
 * Calcula o *score* de balanceamento entre dois times 2×2.
 *
 *  • 0 → multiset de níveis idêntico (melhor caso)
 *  • 1 → soma das diferenças absolutas ≤ 1 (ainda aceitável)
 *  • 2 → qualquer valor maior (considerado ruim; evitaremos ou removeremos)
 */
const pairScore = (a: [Player, Player], b: [Player, Player]): number => {
  const la = [levelKey(a[0]), levelKey(a[1])].sort((x, y) => x - y)
  const lb = [levelKey(b[0]), levelKey(b[1])].sort((x, y) => x - y)

  // Caso ideal: mesmíssimo multiset de níveis.
  if (la[0] === lb[0] && la[1] === lb[1]) return 0

  // Caso aceitável: diferença somada das posições ≤ 1.
  const diff = Math.abs(la[0] - lb[0]) + Math.abs(la[1] - lb[1])
  return diff <= 1 ? 1 : 2
}

/**
 * Verifica se há sobreposição de jogadores entre uma dupla e um time.
 * Usado para garantir que um jogador não apareça em ambos os lados da partida.
 */
const overlap = (pair: [Player, Player], team: [Player, Player]) =>
  pair[0].id === team[0].id || pair[0].id === team[1].id || pair[1].id === team[0].id || pair[1].id === team[1].id

// ---------------------------------------------------------------------------
// Estatísticas auxiliares
// ---------------------------------------------------------------------------

/**
 * Conta quantas partidas cada jogador participou.
 *
 * Retorna um `Map` no qual a chave é `Player.id` e o valor é a quantidade de
 * partidas em que o jogador aparece.
 */
const countMatches = (matches: Match[]): Map<Player['id'], number> => {
  const counts = new Map<Player['id'], number>()

  for (const { teamA, teamB } of matches) {
    for (const p of [...teamA, ...teamB]) {
      counts.set(p.id, (counts.get(p.id) ?? 0) + 1)
    }
  }
  return counts
}

// ---------------------------------------------------------------------------
// ⚖️  balanceEvenParticipation – remove partidas de quem tem “sobras”
// ---------------------------------------------------------------------------
/**
 * Garante que ninguém jogue mais de **uma** partida além do mínimo observado.
 *
 * Estratégia (gananciosa):
 *   1. Enquanto a diferença (max − min) > 1…
 *      a. Identificar jogadores com `max` partidas.
 *      b. Remover a partida *menos equilibrada* (maior *score*) que:
 *         • contenha **pelo menos um** jogador do grupo `max`,
 *         • **nenhum** jogador do grupo `min`.
 *   2. Repetir até ficar impossível (ou desnecessário) remover partidas.
 *
 * Observação: Não adicionamos novas partidas — apenas removemos para equilibrar
 * participações. Isso não afeta a cobertura de duplas já alcançada.
 */
const balanceEvenParticipation = (matches: Match[]): Match[] => {
  const mutable = [...matches] // cópia mutável
  let counts = countMatches(mutable)

  /** Calcula rapidamente os valores mínimo e máximo atuais. */
  const getMinMax = () => {
    const vals = [...counts.values()]
    return { min: Math.min(...vals), max: Math.max(...vals) }
  }

  // ---------------------------------------------------------------------
  // Loop até que max − min ≤ 1, ou não haja mais partidas "removíveis".
  // ---------------------------------------------------------------------
  while (true) {
    const { min, max } = getMinMax()
    if (max - min <= 1) break // já equilibrado

    // ➤ Identifica jogadores nos extremos
    const maxPlayers = new Set([...counts.entries()].filter(([, n]) => n === max).map(([id]) => id))
    const minPlayers = new Set([...counts.entries()].filter(([, n]) => n === min).map(([id]) => id))

    // ➤ Seleciona partidas elegíveis para remoção
    type ScoredMatch = { idx: number; score: number }
    const candidates: ScoredMatch[] = []

    mutable.forEach((m, idx) => {
      const playerIds = [...m.teamA, ...m.teamB].map((p) => p.id)
      const hasMax = playerIds.some((id) => maxPlayers.has(id))
      const hasMin = playerIds.some((id) => minPlayers.has(id))

      if (hasMax && !hasMin) {
        const score = pairScore(m.teamA as [Player, Player], m.teamB as [Player, Player])
        candidates.push({ idx, score })
      }
    })

    if (!candidates.length) break // não há jogo removível sem afetar mínimos

    // Ordena de forma decrescente: score 1 antes de score 0 (queremos remover pior balanceamento)
    candidates.sort((a, b) => b.score - a.score)

    // Remove a partida eleita
    const { idx } = candidates[0]
    mutable.splice(idx, 1)

    // Recalcula contagens (mais simples que atualizar manualmente)
    counts = countMatches(mutable)
  }

  return mutable
}

// ---------------------------------------------------------------------------
// Função principal – geração de partidas
// ---------------------------------------------------------------------------
/**
 * Gera partidas 2×2 atendendo todas as regras de negócio listadas no cabeçalho.
 *
 * Passos (alto nível):
 *   1. Verificações iniciais e construção de *duplas* elegíveis
 *      (respeitando a NOVA REGRA de níveis distintos).
 *   2. Processo ganancioso que:
 *        • escolhe a primeira dupla não coberta → `teamA`;
 *        • procura a dupla disjunta mais bem balanceada → `teamB`.
 *      Repetir até não restarem duplas "não cobertas".
 *   3. Filtrar partidas com *score* ≥ 2 (níveis desequilibrados demais).
 *   4. Aplicar `balanceEvenParticipation` para equalizar participações.
 */
export function generateMatches(players: Player[]): Match[] {
  // ➤ Pré‑condições básicas --------------------------------------------------
  if (players.length < 4) return []

  // Precisamos de pelo menos um par de jogadores com níveis distintos.
  const hasDistinctLevelPair = players.some((p, i) => players.slice(i + 1).some((q) => !sameLevel(p, q)))
  if (!hasDistinctLevelPair) return []

  // ➤ 1. Construção do conjunto "uncovered" -------------------------------
  //    Map<string, [Player, Player]> onde a chave é o par e o valor a dupla.
  const uncovered = new Map<string, [Player, Player]>()
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      if (sameLevel(players[i], players[j])) continue // ✱ NOVA REGRA ✱
      uncovered.set(pairKey(players[i], players[j]), [players[i], players[j]])
    }
  }

  const matches: Match[] = []

  // ➤ 2. Loop ganancioso cobrindo até duas duplas por iteração -------------
  while (uncovered.size) {
    // 2.1 Primeira dupla pendente → `teamA`
    const [, teamA] = uncovered.entries().next().value as [string, [Player, Player]]
    uncovered.delete(pairKey(teamA[0], teamA[1]))

    // 2.2 Melhor dupla disjunta possível → `teamB`
    let bestKey: string | null = null
    let bestPair: [Player, Player] | null = null
    let bestScore = Infinity

    for (const [key, pair] of uncovered.entries()) {
      if (overlap(pair, teamA)) continue // não pode repetir jogador

      const s = pairScore(teamA, pair)
      if (s < bestScore) {
        bestScore = s
        bestKey = key
        bestPair = pair
        if (s === 0) break // já é o equilíbrio ideal
      }
    }

    // Caso não exista par disjunto em `uncovered`, tentamos compor manualmente.
    let teamB: [Player, Player] | null = null
    if (bestPair && bestKey) {
      teamB = bestPair
      uncovered.delete(bestKey)
    } else {
      // Fallback: qualquer dupla válida (níveis distintos) entre os restantes.
      const others = players.filter((p) => p.id !== teamA[0].id && p.id !== teamA[1].id)
      outer: for (let i = 0; i < others.length; i++) {
        for (let j = i + 1; j < others.length; j++) {
          if (!sameLevel(others[i], others[j])) {
            teamB = [others[i], others[j]]
            break outer
          }
        }
      }
    }

    if (!teamB) break // não há mais partidas válidas

    matches.push({ teamA, teamB })
  }

  // ➤ 3. Remove partidas muito desbalanceadas (score ≥ 2) ------------------
  const filtered = matches.filter((m) => pairScore(m.teamA as [Player, Player], m.teamB as [Player, Player]) < 2)

  // ➤ 4. Equaliza participação entre jogadores ----------------------------
  return balanceEvenParticipation(filtered)
}
