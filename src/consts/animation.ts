// Entrada: ultra rápido, ainda com um leve bounce (~150 ms)
export const appleSpringEnter = {
  type: 'spring' as const,
  stiffness: 550, // de 450 → 550 (aumenta velocidade)
  damping: 24, // de 22  → 24 (controle minimalista da quicada)
  mass: 0.8, // de 0.9 → 0.8 (menos inércia)
}

// Saída: relâmpago e bem contida (~130 ms)
export const appleSpringExit = {
  type: 'spring' as const,
  stiffness: 1000, // de 800 → 1000 (realmente rápido)
  damping: 36, // de 32  → 36 (amortecimento suficiente)
  mass: 0.8,
}

export const itemVariants = {
  initial: { opacity: 0, scale: 0.9, y: 12 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      ...appleSpringEnter,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      ...appleSpringExit,
    },
  },
}

export const spring = { type: 'spring', stiffness: 500, damping: 38, mass: 0.9 }
