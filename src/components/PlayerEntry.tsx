import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { avatarUrl } from '@/lib/utils'

interface Props {
  name: string
  /** When true, avatar goes on the right and text on the left (used for team B entries) */
  reverse?: boolean
  className?: string
  matchCount?: number
}

/** Compact “avatar + name” line — text truncates cleanly when space is tight */
export function PlayerEntry({ name, reverse = false, className = '', matchCount }: Props) {
  return (
    <div className={`flex items-center ${reverse ? 'justify-end' : 'justify-between'} gap-2 ${className}`}>
      {/* avatar + name (shrinks if needed) */}
      <div className={`flex items-center gap-2 ${reverse ? 'flex-row-reverse' : ''} min-w-0`}>
        <Avatar className="w-6 h-6 shrink-0">
          <AvatarImage src={avatarUrl(name)} alt={name} />
          <AvatarFallback>
            {name
              .split(' ')
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase())
              .join('')}
          </AvatarFallback>
        </Avatar>
        <p className="truncate whitespace-nowrap overflow-hidden text-md">{name}</p>
      </div>

      {/* optional match‑count badge */}
      {matchCount !== undefined && (
        <p className="text-md text-muted-foreground shrink-0">
          {matchCount} partida{matchCount === 1 ? '' : 's'}
        </p>
      )}
    </div>
  )
}
