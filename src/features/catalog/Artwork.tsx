import type { Nft } from '../../shared/contracts'
interface ArtworkProps { nft: Nft; priority?: boolean; large?: boolean; className?: string }
export function Artwork({ nft, priority = false, large = false, className = '' }: ArtworkProps) {
  if (!nft.artwork) return <div className={`art-pending ${className}`} aria-label={`Arte de ${nft.name} ainda indisponível`}><span>KURIO</span></div>
  return <img
    src={`${nft.artwork}-${large ? 960 : 480}.webp`}
    srcSet={`${nft.artwork}-480.webp 480w, ${nft.artwork}-960.webp 960w`}
    sizes={large ? '(max-width: 600px) calc(100vw - 48px), (max-width: 1000px) 50vw, 560px' : '(max-width: 600px) calc((100vw - 64px) / 2), (max-width: 1000px) 30vw, 270px'}
    width="960" height="960" alt={`Ilustração de ${nft.name}`}
    loading={priority ? 'eager' : 'lazy'} fetchPriority={priority ? 'high' : 'auto'} decoding="async"
    className={`nft-artwork ${className}`}
  />
}
