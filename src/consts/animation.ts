// Configuração de spring recomendada pelo Framer Motion
const springEnter = {
  type: 'spring' as const,
  duration: 0.4,
  bounce: 0.2,
}

const springExit = {
  type: 'spring' as const,
  duration: 0.3,
  bounce: 0,
}

export const itemVariants = {
  initial: { opacity: 0, y: 12 },
  animate: {
    opacity: 1,
    y: 0,
    transition: springEnter,
  },
  exit: {
    opacity: 0,
    y: 12, // mantém o mesmo deslocamento de saída
    transition: springExit,
  },
}
