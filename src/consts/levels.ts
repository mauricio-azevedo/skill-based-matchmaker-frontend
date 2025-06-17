// src/consts/levels.ts
// ---------------------------------------------------------------------------
// Tabela ‘valor numérico → label visual’ usada em toda a aplicação.
// ---------------------------------------------------------------------------

export const LEVELS = [
  { value: 1, label: 'C' },
  { value: 2, label: 'B' },
  { value: 3, label: 'BB' },
  { value: 4, label: 'A' },
  { value: 5, label: 'AA' },
] as const // ⬅️ ‘as const’ preserva tipos literais

// Helper genérico: devolve label ou fallback
export function getLevelLabel(level: number): string {
  return LEVELS.find((l) => l.value === level)?.label ?? `N${level}`
}

// Descrições detalhadas de cada nível (ignora links de origem)
export const LEVEL_DESCRIPTIONS: Record<number, string> = {
  1: '<strong>C - Beginner</strong><br/>• Aprende fundamentos: pegada, forehand, backhand e voleio básicos<br/>• Começa a se mover corretamente na areia<br/><br/><em>Fortalecer:</em> ganhar consistência no contato com a bola e entender posicionamentos simples de dupla.',
  2: '<strong>B – Fun</strong><br/>• Sustenta trocas de bola mais lentas<br/>• Já serve e devolve com regularidade<br/>• Consegue manter ritmo em bate‑bola recreativo<br/><br/><em>Fortalecer:</em> melhorar precisão (acertar “ponto doce” da raquete) e memorizar posições de ataque/defesa.',
  3: '<strong>BB – Intermediate</strong><br/>• Mantém rallies em velocidade média<br/>• Variedade razoável de golpes (lob, drop, smash simples)<br/>• Começa a ditar direção, velocidade e profundidade<br/><br/><em>Fortalecer:</em> controlar bola fora da zona de conforto e manter continuidade contra bolas rápidas.',
  4: '<strong>A – Advanced</strong><br/>• Domínio técnico: ajusta direção e profundidade de forehand/backhand<br/>• Usa lobs, smashes e curtinhas para construir o ponto<br/>• Saque raramente falha<br/><br/><em>Fortalecer:</em> reduzir erros não forçados e refinar variação tática em jogadas longas.',
  5: '<strong>AA – Pro</strong><br/>• Lê jogo adversário e antecipa jogadas<br/>• Finaliza pontos com drop‑shots, lobs e smashes potentes<br/>• Controla spin, profundidade e ritmo do saque<br/>• Forte mentalmente e defensivamente<br/><br/><em>Fortalecer:</em> manter performance sob pressão extrema e aprimorar decisões em situações‑limite.',
}
