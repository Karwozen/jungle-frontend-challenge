import type { Image } from '@/domain/common/schema'

export const artworks = {
  emerald: { path: '/images/nfts/emerald', accessory: 'Óculos', outfit: 'Jaqueta college' },
  golden: { path: '/images/nfts/golden', accessory: 'Fones', outfit: 'Jaqueta creme' },
  violet: { path: '/images/nfts/violet', accessory: 'Chapéu bucket', outfit: 'Moletom' },
  onyx: { path: '/images/nfts/onyx', accessory: 'Brinco', outfit: 'Gola alta' },
}
export type Artwork = keyof typeof artworks

export function toImage(path: string): Image {
  const widths = [320, 640, 1200]
  return {
    url: `${path}-1200.webp`,
    width: 1200,
    height: 1200,
    variants: widths.map((width) => ({ url: `${path}-${width}.webp`, width })),
  }
}
