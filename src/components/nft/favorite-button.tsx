import { Heart } from 'lucide-react'
import { useFavorite } from '@/features/favorites/use-favorite'
import { cn } from '@/lib/utils'

function FavoriteButton({ nftId, name, className }: { nftId: string; name: string; className?: string }) {
  const { active, toggle } = useFavorite(nftId)

  return (
    <button
      type="button"
      aria-pressed={active}
      aria-label={`${active ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}: ${name}`}
      onClick={toggle}
      className={cn(
        'flex size-8 items-center justify-center rounded-full bg-background/60 text-foreground outline-none backdrop-blur-sm transition-opacity focus-visible:opacity-100 focus-visible:ring-3 focus-visible:ring-ring/50 md:opacity-0 md:group-hover:opacity-100 md:aria-pressed:opacity-100',
        className,
      )}
    >
      <Heart aria-hidden className={cn('size-4', active && 'fill-red-500 text-red-500')} />
    </button>
  )
}

export default FavoriteButton
