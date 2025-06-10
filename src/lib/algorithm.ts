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
//  3. **Participação uniforme**: no resultado final, todos os jogadores devem
//     ter **exatamente** o mesmo número de partidas. Caso contrário, o
//     algoritmo tenta uma nova geração (até `MAX_REGENERATIONS`).
//  4. **Nunca** formar uma dupla em que ambos
//     os jogadores tenham o **mesmo nível**.
//  5. Se existir ao menos um *round* com menos
//     partidas do que o número de `courts`, inicia‑se uma nova geração.
//  6. Reorganiza os rounds já calculados para “espalhar” ao máximo a presença
//     de cada jogador.
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
// Constantes de configuração (➡ evita *magic numbers*)
// ---------------------------------------------------------------------------

/** Nº máximo de tentativas de geração antes de devolver o melhor resultado encontrado. */
const MAX_REGENERATIONS = 100
/** Diferença máxima permitida entre jogadores (0 → todos iguais). */
const ALLOWED_MATCH_DIFF = 0
/** Nº máximo de *rounds* incompletos permitido (0 → todos completos). */
const ALLOWED_INCOMPLETE_ROUNDS = 0

const MAX_IDLE_ROUNDS = 3 // ninguém pode ficar > 3 rounds sem atuar
const MAX_ORDER_RETRIES = 100 // repete a tentativa de ordenação até

// ---------------------------------------------------------------------------
// Utilidades internas
// ---------------------------------------------------------------------------
/**
 * Reordena os rounds garantindo que nenhum jogador permaneça mais
 * que `MAX_IDLE_ROUNDS` consecutivos fora.
 *
 * Estratégia (greedy + verificação de viabilidade):
 *   • Mantém `wait[id]` = quantos rounds seguidos o atleta está fora.
 *   • Na posição `idx`, avalia todos os rounds restantes e filtra
 *     apenas os que não estourariam `MAX_IDLE_ROUNDS`.
 *   • Entre os viáveis, escolhe o que:
 *        1. Minimiza o novo maior `waitMax` (max-min);
 *        2. Desempata pela soma dos gaps (como antes).
 *   • Se nenhum round for viável → não existe solução com a regra
 *     atual (lança erro; o gerador externo tentará nova chave).
 *
 * Complexidade: O(R²·P) – idêntica ao heurístico anterior.
 */
const reorderRoundsForSpacing = (rounds: Round[]): Round[] => {
  const remaining = [...rounds]
  const ordered: Round[] = []

  // Coleta todos os IDs de atletas presentes na chave
  const allIds = new Set<Player['id']>()
  for (const { matches } of rounds)
    for (const { teamA, teamB } of matches) for (const p of [...teamA, ...teamB]) allIds.add(p.id)

  // Mapa “há quantos rounds seguidos está de fora”
  const wait = new Map<Player['id'], number>()
  allIds.forEach((id) => wait.set(id, 0))

  for (let idx = 0; remaining.length; idx++) {
    let bestIdx = -1
    let bestWaitMax = Infinity
    let bestSumGaps = -Infinity

    for (let i = 0; i < remaining.length; i++) {
      const round = remaining[i]

      // Calcula wait após jogar este round
      let feasible = true
      let waitMax = 0
      let sumGaps = 0

      for (const id of allIds) {
        const playsHere = round.matches.some(
          (m) => m.teamA.some((p) => p.id === id) || m.teamB.some((p) => p.id === id),
        )
        const newWait = playsHere ? 0 : wait.get(id)! + 1

        if (newWait > MAX_IDLE_ROUNDS) {
          feasible = false
          break
        }
        if (newWait > waitMax) waitMax = newWait
        sumGaps += newWait
      }

      if (!feasible) continue

      // Critério: menor waitMax; empate → maior soma (beneficia quem espera mais)
      if (waitMax < bestWaitMax || (waitMax === bestWaitMax && sumGaps > bestSumGaps)) {
        bestIdx = i
        bestWaitMax = waitMax
        bestSumGaps = sumGaps
      }
    }

    if (bestIdx === -1) {
      // Não existe round viável: requisito de 3 rounds é impossível
      throw new Error(`Impossível ordenar sem exceder ${MAX_IDLE_ROUNDS} rodadas ociosas`)
    }

    const [chosen] = remaining.splice(bestIdx, 1)
    ordered.push(chosen)

    // Atualiza espera de todos
    for (const id of allIds) {
      const playsHere = chosen.matches.some((m) => m.teamA.some((p) => p.id === id) || m.teamB.some((p) => p.id === id))
      wait.set(id, playsHere ? 0 : wait.get(id)! + 1)
    }
  }

  return ordered
}

/** Retorna *true* se as duas partidas compartilham algum jogador. */
const sharesPlayer = (a: Match, b: Match) => {
  const idsA = new Set([...a.teamA, ...a.teamB].map((p) => p.id))
  return [...b.teamA, ...b.teamB].some((p) => idsA.has(p.id))
}

/**
 * Gera o cronograma *uma única vez*.
 * Responsável apenas por alocar as partidas geradas por `generateMatches`
 * em *rounds* respeitando `courts` e evitando sobreposição de jogadores.
 */
const generateScheduleSingle = (matches: Match[], courts: number): Round[] => {
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

/** Gera uma chave única (e ordenada) para um par de jogadores. */
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

  if (la[0] === lb[0] && la[1] === lb[1]) return 0

  const diff = Math.abs(la[0] - lb[0]) + Math.abs(la[1] - lb[1])
  return diff <= 1 ? 1 : 2
}

/** Verifica se há sobreposição de jogadores entre uma dupla e um time. */
const overlap = (pair: [Player, Player], team: [Player, Player]) =>
  pair[0].id === team[0].id || pair[0].id === team[1].id || pair[1].id === team[0].id || pair[1].id === team[1].id

// ---------------------------------------------------------------------------
// Estatísticas auxiliares
// ---------------------------------------------------------------------------

/** Conta quantas partidas cada jogador participou. */
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
 * NOTA: Mantivemos esta função para ajudar a aproximar do equilíbrio, mas a
 * regra 3 (diferença 0) será verificada ao final; se ainda restar diferença,
 * uma nova geração será tentada.
 */
const balanceEvenParticipation = (matches: Match[]): Match[] => {
  const mutable = [...matches] // cópia mutável
  let counts = countMatches(mutable)

  const getMinMax = () => {
    const vals = [...counts.values()]
    return { min: Math.min(...vals), max: Math.max(...vals) }
  }

  while (true) {
    const { min, max } = getMinMax()
    if (max - min <= 1) break

    const maxPlayers = new Set([...counts.entries()].filter(([, n]) => n === max).map(([id]) => id))
    const minPlayers = new Set([...counts.entries()].filter(([, n]) => n === min).map(([id]) => id))

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

    if (!candidates.length) break

    candidates.sort((a, b) => b.score - a.score)

    const { idx } = candidates[0]
    mutable.splice(idx, 1)

    counts = countMatches(mutable)
  }

  return mutable
}

// ---------------------------------------------------------------------------
// Função principal – geração de partidas
// ---------------------------------------------------------------------------
/**
 * Tenta gerar um cronograma (rounds) respeitando TODAS as regras de negócio.
 * Se após `MAX_REGENERATIONS` tentativas não houver solução perfeita,
 * devolve‑se o melhor resultado encontrado segundo a métrica
 * (diferença, rounds incompletos).
 */
export function generateSchedule(players: Player[], courts: number): Round[] {
  if (courts < 1) throw new Error('courts must be ≥ 1')
  if (players.length < 4) return []

  /** Métrica de qualidade da solução. Quanto menor, melhor. */
  const scoreSolution = (rounds: Round[]) => {
    const counts = countMatches(rounds.flatMap((r) => r.matches))
    const vals = [...counts.values()]
    return {
      diff: Math.max(...vals) - Math.min(...vals),
      incomplete: rounds.filter((r) => r.matches.length < courts).length,
    }
  }

  let bestRounds: Round[] = []
  let bestScore = { diff: Infinity, incomplete: Infinity }

  // ➊ tenta gerar e ordenar até MAX_REGENERATIONS combinações diferentes
  outer: for (let attempt = 0; attempt < MAX_REGENERATIONS; attempt++) {
    const matches = generateMatches(shuffle(players))
    const roundsBase = generateScheduleSingle(matches, courts)

    // ➋ para cada geração, tenta ordenar até MAX_ORDER_RETRIES vezes
    for (let retry = 0; retry < MAX_ORDER_RETRIES; retry++) {
      let rounds: Round[]
      try {
        rounds = reorderRoundsForSpacing(roundsBase)
      } catch (err) {
        const msg = (err as Error).message
        // Erro de espaçamento? → volta ao topo do loop `retry`
        if (msg.includes('rodadas ociosas')) continue
        // Erro diferente? → propaga
        throw err
      }

      const { diff, incomplete } = scoreSolution(rounds)

      // Solução perfeita? Encerra imediatamente
      if (diff === ALLOWED_MATCH_DIFF && incomplete === ALLOWED_INCOMPLETE_ROUNDS) {
        return rounds
      }

      // Melhor resultado até agora?
      if (diff < bestScore.diff || (diff === bestScore.diff && incomplete < bestScore.incomplete)) {
        bestRounds = rounds
        bestScore = { diff, incomplete }
      }

      // Não é perfeita → quebra o laço interno e volta ao `outer` para
      // gerar um novo conjunto de partidas totalmente diferente.
      break
    }
  }

  // ➌ Se chegou aqui, *todas* as tentativas falharam
  if (!bestRounds.length) {
    throw new Error(
      `Não foi possível gerar um cronograma sem exceder ${MAX_IDLE_ROUNDS} ` +
        `rodadas ociosas após ${MAX_REGENERATIONS * MAX_ORDER_RETRIES} ` +
        `tentativas. Ajuste as restrições ou o número de jogadores e tente novamente.`,
    )
  }

  return bestRounds
}

// ---------------------------------------------------------------------------
// generateMatches – permanece inalterada, mas reaproveitamos sua implementação
// original. Copiada aqui integralmente para manter o arquivo autocontido.
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
  if (players.length < 4) return []

  const hasDistinctLevelPair = players.some((p, i) => players.slice(i + 1).some((q) => !sameLevel(p, q)))
  if (!hasDistinctLevelPair) return []

  const uncovered = new Map<string, [Player, Player]>()
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      if (sameLevel(players[i], players[j])) continue // ✱ NOVA REGRA ✱
      uncovered.set(pairKey(players[i], players[j]), [players[i], players[j]])
    }
  }

  const matches: Match[] = []

  while (uncovered.size) {
    const [, teamA] = uncovered.entries().next().value as [string, [Player, Player]]
    uncovered.delete(pairKey(teamA[0], teamA[1]))

    let bestKey: string | null = null
    let bestPair: [Player, Player] | null = null
    let bestScore = Infinity

    for (const [key, pair] of uncovered.entries()) {
      if (overlap(pair, teamA)) continue

      const s = pairScore(teamA, pair)
      if (s < bestScore) {
        bestScore = s
        bestKey = key
        bestPair = pair
        if (s === 0) break
      }
    }

    let teamB: [Player, Player] | null = null
    if (bestPair && bestKey) {
      teamB = bestPair
      uncovered.delete(bestKey)
    } else {
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

    if (!teamB) break

    matches.push({ teamA, teamB })
  }

  const filtered = matches.filter((m) => pairScore(m.teamA as [Player, Player], m.teamB as [Player, Player]) < 2)
  return balanceEvenParticipation(filtered)
}
