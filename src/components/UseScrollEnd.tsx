import React, { useEffect } from 'react'

export function useScrollEnd(ref: React.RefObject<HTMLElement | null>, onEnd: () => void) {
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('scrollend', onEnd)
    return () => el.removeEventListener('scrollend', onEnd)
  }, [ref, onEnd])
}
