import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { avatarUrl } from '@/lib/utils'

interface Props {
  name: string
  /** When true, puts the avatar on the right and text on the left (used for team B columns) */
  reverse?: boolean
  className?: string
}

/** Small, reusable “avatar + name” line (truncates at 90px) */
export function PlayerEntry({ name, reverse = false, className = '' }: Props) {
  return (
    <div className={`flex items-center gap-2 ${reverse ? 'flex-row-reverse text-left' : 'text-left'} ${className}`}>
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
      <p className="truncate max-w-[90px] text-sm">{name}</p>
    </div>
  )
}
