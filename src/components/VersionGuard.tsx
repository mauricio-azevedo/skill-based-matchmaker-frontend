import type { ReactNode } from 'react'
import { useVersionGuard } from '@/hooks/useVersionGuard'

interface VersionGuardProps {
  children: ReactNode
}

/**
 * Component that checks app version on mount and clears data if outdated.
 */
export function VersionGuard({ children }: VersionGuardProps) {
  useVersionGuard()
  return <>{children}</>
}
