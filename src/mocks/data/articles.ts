import type { ArticleSummary } from '@/domain/articles/schema'
import { artworks, toImage, type Artwork } from '@/mocks/data/images'

const rows: (Omit<ArticleSummary, 'image'> & { art: Artwork })[] = [
  {
    id: 'art-001',
    slug: 'como-funciona-a-propriedade-de-nfts',
    title: 'Como funciona a propriedade de NFTs',
    excerpt: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    publishedAt: '2026-09-12T09:00:00.000Z',
    readingMinutes: 6,
    art: 'emerald',
  },
  {
    id: 'art-002',
    slug: '10-artistas-digitais-para-acompanhar',
    title: '10 artistas digitais para acompanhar',
    excerpt: 'Conheça criadores que moldam a cultura digital.',
    publishedAt: '2026-09-13T09:00:00.000Z',
    readingMinutes: 2,
    art: 'golden',
  },
  {
    id: 'art-003',
    slug: 'raridade-atributos-e-procedencia',
    title: 'Raridade, atributos e procedência',
    excerpt: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    publishedAt: '2026-09-15T09:00:00.000Z',
    readingMinutes: 3,
    art: 'violet',
  },
  {
    id: 'art-004',
    slug: 'como-proteger-sua-carteira',
    title: 'Como proteger sua carteira',
    excerpt: 'Proteja sua carteira, seus ativos e sua identidade.',
    publishedAt: '2026-09-15T15:00:00.000Z',
    readingMinutes: 2,
    art: 'onyx',
  },
]

export function buildArticles(): ArticleSummary[] {
  return rows.map(({ art, ...article }) => ({ ...article, image: toImage(artworks[art].path) }))
}
