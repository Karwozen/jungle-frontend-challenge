import type { CatalogSearch } from '@/features/catalog/search'

export interface HeroSlideContent {
  title: string
  text: string
  compact: { title: string; text: string }
  cta: string
  search: CatalogSearch
}

export const heroSlides: HeroSlideContent[] = [
  {
    title: 'Seja dono do futuro\nda arte digital',
    text: 'Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital rara, apoie artistas e tenha uma parte da cultura da internet.',
    compact: { title: 'Seja dono da cultura digital', text: 'Descubra NFTs selecionados de criadores do mundo todo.' },
    cta: 'Explorar',
    search: {},
  },
  {
    title: 'Descubra quem está\ncriando o futuro',
    text: 'Conheça artistas independentes, acompanhe suas coleções e descubra obras únicas antes que elas se tornem clássicas.',
    compact: { title: 'Descubra quem cria o futuro', text: 'Conheça artistas e suas coleções.' },
    cta: 'Explorar',
    search: { tab: 'new' },
  },
  {
    title: 'Encontre uma peça\nque é só sua',
    text: 'De obras marcantes a edições raras, encontre NFTs para começar ou transformar sua coleção digital.',
    compact: { title: 'Encontre uma peça só sua', text: 'Do clássico ao raro, comece sua coleção.' },
    cta: 'Ver coleção',
    search: { tab: 'trending' },
  },
]
