import type { Category, Edition, Network, Nft } from '@/domain/catalog/schema'
import { mulEth, type EthAmount } from '@/lib/eth'
import { MOCK_NOW } from '@/mocks/clock'
import { artworks, toImage, type Artwork } from '@/mocks/data/images'
import type { ReviewRecord } from '@/mocks/db'

const HOUR = 3_600_000

const creators = {
  'nova-sato': 'Nova Sato',
  'ilan-reyes': 'Ilan Reyes',
  'aiko-tanaka': 'Aiko Tanaka',
  'jonas-weiss': 'Jonas Weiß',
  'mira-adeyemi': 'Mira Adeyemi',
}

const collections = {
  'kurio-apes': {
    name: 'Kurio Apes',
    creator: 'nova-sato',
    royalty: 5,
    contract: '0x7A42c8E1B04d93F5a6C2d71e8B3F09a4D5c619E8',
    blurb: 'a coleção de retratos de macacos que deu origem ao Kurio',
  },
  'kurio-editions': {
    name: 'Kurio Editions',
    creator: 'nova-sato',
    royalty: 5,
    contract: '0xb63816dd316bc03f78269fd72d4c69e71539e325',
    blurb: 'edições limitadas lançadas diretamente pelos criadores da plataforma',
  },
  'sage-nomads': {
    name: 'Sage Nomads',
    creator: 'ilan-reyes',
    royalty: 7.5,
    contract: '0x7373ac60e053bbe7a57423e60b9937fe1fb894b8',
    blurb: 'viajantes urbanos ilustrados em tons de verde e lavanda',
  },
  'neon-vessels': {
    name: 'Neon Vessels',
    creator: 'aiko-tanaka',
    royalty: 5,
    contract: '0x542511115fc70b76b7f68fa9e365720f60f1c99d',
    blurb: 'obras generativas que misturam retrato e luz de neon',
  },
  'golden-signals': {
    name: 'Golden Signals',
    creator: 'jonas-weiss',
    royalty: 10,
    contract: '0x649b5fb37bfd2ade42ffcf9b3dfd0fabbea54517',
    blurb: 'a série de retratos musicais da galeria Golden Signals',
  },
  'ivory-barons': {
    name: 'Ivory Barons',
    creator: 'mira-adeyemi',
    royalty: 5,
    contract: '0x08123b53311dcb924182ecef2db1de9108e195b6',
    blurb: 'retratos formais de uma sociedade fictícia de colecionadores',
  },
}
type CollectionId = keyof typeof collections

// toda obra tem as mesmas edições, com preço em múltiplo do preço-base
const editionTemplate = [
  { supply: 1, factor: 5 },
  { supply: 10, factor: 2 },
  { supply: 50, factor: 1 },
  { supply: null, factor: 0.5 },
]

const reviewers = [
  { id: 'usr_juliana', name: 'Juliana Costa' },
  { id: 'usr_theo', name: 'Theo Marlowe' },
  { id: 'usr_clara', name: 'Clara Nogueira' },
  { id: 'usr_bruno', name: 'Bruno Tavares' },
  { id: 'usr_yara', name: 'Yara Haddad' },
  { id: 'usr_diego', name: 'Diego Fontes' },
  { id: 'usr_lia', name: 'Lia Moreira' },
  { id: 'usr_otto', name: 'Otto Brandt' },
  { id: 'usr_sana', name: 'Sana Ito' },
  { id: 'usr_caio', name: 'Caio Ribeiro' },
]

const reviewTexts = [
  'A arte em alta resolução é ainda mais bonita do que na prévia. Chegou na carteira em poucos minutos.',
  'Boa procedência e metadados completos. Fiquei tranquilo com a verificação do contrato.',
  'Comprei a edição 1/10 e valeu cada centavo. Os detalhes da ilustração impressionam de perto.',
  'O criador respondeu rápido às minhas dúvidas antes da compra. Recomendo.',
  'Combina muito com o resto da minha coleção. Já estou de olho nos próximos lançamentos.',
  'A taxa de rede foi justa e o processo de compra foi simples do início ao fim.',
  'Gostei bastante, só achei que o preço subiu rápido depois que entrou em alta.',
  'Peça sólida. A paleta de cores ficou perfeita no meu perfil.',
  'Esperava um pouco mais de utilidade além da arte, mas a qualidade da obra compensa.',
  'Ótimo custo-benefício na edição aberta. Boa porta de entrada para quem está começando.',
]

interface Row {
  name: string
  tokenId: string
  art: Artwork
  collection: CollectionId
  category: Category
  network: Network
  price: EthAmount
  previousPrice?: EthAmount
  rarity: 'Comum' | 'Raro' | 'Épico'
  // uma nota por avaliação: '545' são três avaliações (5, 4 e 5)
  stars: string
  trending?: boolean
  featured?: boolean
  spotlight?: boolean
  badge?: string
  soldOut?: boolean
  summary?: string
  traits?: Nft['traits']
}

const rarityOf = { Comum: 'common', Raro: 'rare', Épico: 'epic' } as const

// a ordem define "Listados recentemente"
const rows: Row[] = [
  {
    name: 'Emerald Ape #042', tokenId: '0042', art: 'emerald', collection: 'kurio-apes', category: 'digital-art', network: 'ethereum',
    price: '1.19', rarity: 'Raro', stars: '5555455554555545555', trending: true, featured: true,
    summary: 'Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores.',
    traits: [
      { type: 'Acessório', value: 'Óculos' },
      { type: 'Cor', value: 'Esmeralda' },
      { type: 'Raridade', value: 'Raro' },
    ],
  },
  { name: 'Sage Nomad #009', tokenId: '0009', art: 'violet', collection: 'sage-nomads', category: 'collectibles', network: 'ethereum', price: '1.69', rarity: 'Comum', stars: '54545', trending: true, featured: true },
  { name: 'Neon Vessel #552', tokenId: '0552', art: 'onyx', collection: 'neon-vessels', category: 'generative', network: 'polygon', price: '1.99', previousPrice: '2.29', rarity: 'Raro', stars: '555435', trending: true },
  { name: 'Cosmic Bloom #118', tokenId: '0118', art: 'violet', collection: 'kurio-editions', category: '3d-art', network: 'ethereum', price: '1.29', rarity: 'Comum', stars: '4545', spotlight: true, badge: 'Oferta limitada' },
  { name: 'Violet Nomad #314', tokenId: '0314', art: 'violet', collection: 'sage-nomads', category: 'photography', network: 'solana', price: '1.39', rarity: 'Comum', stars: '45345' },
  { name: 'Ivory Baron #088', tokenId: '0088', art: 'onyx', collection: 'ivory-barons', category: 'digital-art', network: 'ethereum', price: '1.79', rarity: 'Épico', stars: '55545554', trending: true },
  { name: 'Golden Beat #207', tokenId: '0207', art: 'golden', collection: 'golden-signals', category: 'music', network: 'polygon', price: '0.99', rarity: 'Comum', stars: '4545' },
  { name: 'Golden Signal #160', tokenId: '0160', art: 'golden', collection: 'golden-signals', category: 'music', network: 'ethereum', price: '0.39', rarity: 'Comum', stars: '545', featured: true },
  { name: 'Sunset Ape #071', tokenId: '0071', art: 'emerald', collection: 'kurio-apes', category: 'photography', network: 'ethereum', price: '2.45', rarity: 'Raro', stars: '5554555', trending: true },
  { name: 'Mauve Nomad #126', tokenId: '0126', art: 'violet', collection: 'sage-nomads', category: 'photography', network: 'solana', price: '0.72', previousPrice: '0.85', rarity: 'Comum', stars: '454' },
  { name: 'Obsidian Baron #305', tokenId: '0305', art: 'onyx', collection: 'ivory-barons', category: 'digital-art', network: 'ethereum', price: '3.1', rarity: 'Épico', stars: '555545', trending: true },
  { name: 'Golden Verse #412', tokenId: '0412', art: 'golden', collection: 'golden-signals', category: 'music', network: 'ethereum', price: '0.58', rarity: 'Comum', stars: '4435' },
  { name: 'Ruby Ape #019', tokenId: '0019', art: 'emerald', collection: 'kurio-apes', category: 'gaming', network: 'polygon', price: '0.84', rarity: 'Comum', stars: '3545' },
  { name: 'Thistle Nomad #227', tokenId: '0227', art: 'violet', collection: 'sage-nomads', category: 'memberships', network: 'polygon', price: '0.25', rarity: 'Comum', stars: '445' },
  { name: 'Cinder Baron #640', tokenId: '0640', art: 'onyx', collection: 'ivory-barons', category: '3d-art', network: 'ethereum', price: '4.2', previousPrice: '4.8', rarity: 'Épico', stars: '55455', soldOut: true },
  { name: 'Golden Reverb #318', tokenId: '0318', art: 'golden', collection: 'golden-signals', category: 'memberships', network: 'solana', price: '0.15', rarity: 'Comum', stars: '354' },
  { name: 'Cedar Ape #133', tokenId: '0133', art: 'emerald', collection: 'kurio-editions', category: 'generative', network: 'ethereum', price: '1.55', rarity: 'Raro', stars: '5455545', trending: true },
  { name: 'Dune Nomad #482', tokenId: '0482', art: 'violet', collection: 'neon-vessels', category: 'memberships', network: 'ethereum', price: '0.02', rarity: 'Comum', stars: '435' },
  { name: 'Cobalt Baron #219', tokenId: '0219', art: 'onyx', collection: 'ivory-barons', category: 'photography', network: 'polygon', price: '1.12', rarity: 'Raro', stars: '5445' },
  { name: 'Golden Loop #091', tokenId: '0091', art: 'golden', collection: 'neon-vessels', category: 'generative', network: 'polygon', price: '0.47', rarity: 'Comum', stars: '454' },
  { name: 'Misty Ape #256', tokenId: '0256', art: 'emerald', collection: 'kurio-apes', category: 'collectibles', network: 'solana', price: '0.66', rarity: 'Comum', stars: '4545' },
  { name: 'Plum Nomad #347', tokenId: '0347', art: 'violet', collection: 'sage-nomads', category: 'gaming', network: 'ethereum', price: '0.92', previousPrice: '1.1', rarity: 'Comum', stars: '54354', trending: true },
  { name: 'Granite Baron #001', tokenId: '0001', art: 'onyx', collection: 'kurio-editions', category: 'collectibles', network: 'ethereum', price: '12.3', rarity: 'Épico', stars: '555' },
  { name: 'Golden Chord #175', tokenId: '0175', art: 'golden', collection: 'golden-signals', category: 'music', network: 'ethereum', price: '1.48', rarity: 'Raro', stars: '55445' },
  { name: 'Saffron Ape #389', tokenId: '0389', art: 'emerald', collection: 'kurio-apes', category: 'digital-art', network: 'polygon', price: '0.77', rarity: 'Comum', stars: '4454' },
  { name: 'Heath Nomad #064', tokenId: '0064', art: 'violet', collection: 'sage-nomads', category: 'memberships', network: 'polygon', price: '0.12', rarity: 'Comum', stars: '345' },
  { name: 'Pewter Baron #712', tokenId: '0712', art: 'onyx', collection: 'ivory-barons', category: 'gaming', network: 'ethereum', price: '2.6', rarity: 'Raro', stars: '54555' },
  { name: 'Golden Tape #520', tokenId: '0520', art: 'golden', collection: 'golden-signals', category: 'music', network: 'solana', price: '1.9', rarity: 'Raro', stars: '4555', soldOut: true },
  { name: 'Harbor Ape #205', tokenId: '0205', art: 'emerald', collection: 'kurio-apes', category: '3d-art', network: 'ethereum', price: '3.75', rarity: 'Épico', stars: '555445' },
  { name: 'Fern Nomad #033', tokenId: '0033', art: 'violet', collection: 'kurio-editions', category: 'collectibles', network: 'solana', price: '0.54', rarity: 'Comum', stars: '454' },
  { name: 'Walnut Baron #468', tokenId: '0468', art: 'onyx', collection: 'neon-vessels', category: 'generative', network: 'polygon', price: '2.2', rarity: 'Raro', stars: '5454' },
  { name: 'Golden Wave #144', tokenId: '0144', art: 'golden', collection: 'kurio-editions', category: '3d-art', network: 'ethereum', price: '5.15', rarity: 'Épico', stars: '55545' },
  { name: 'Quartz Ape #590', tokenId: '0590', art: 'emerald', collection: 'neon-vessels', category: 'gaming', network: 'solana', price: '0.31', rarity: 'Comum', stars: '435' },
  { name: 'Moor Nomad #276', tokenId: '0276', art: 'violet', collection: 'sage-nomads', category: 'digital-art', network: 'ethereum', price: '1.05', rarity: 'Comum', stars: '4545' },
  { name: 'Opal Baron #351', tokenId: '0351', art: 'onyx', collection: 'ivory-barons', category: 'music', network: 'polygon', price: '0.88', rarity: 'Comum', stars: '4454' },
]

const slugify = (name: string) => name.toLowerCase().replace(/#/g, '').trim().replace(/\s+/g, '-')

export function buildCatalog() {
  const nfts: Nft[] = []
  const reviews: ReviewRecord[] = []

  rows.forEach((row, index) => {
    const art = artworks[row.art]
    const collection = collections[row.collection]
    const id = slugify(row.name)
    const token = Number(row.tokenId)
    const stars = [...row.stars].map(Number)

    const editions: Edition[] = editionTemplate
      .filter((e) => !(row.soldOut && e.supply === null))
      .map((e) => ({
        id: `${id}-${e.supply ?? 'open'}`,
        kind: e.supply === null ? 'open' : 'limited',
        supply: e.supply,
        available: row.soldOut ? 0 : e.supply === null ? null : 1 + (token % e.supply),
        price: mulEth(row.price, e.factor),
      }))

    nfts.push({
      id,
      tokenId: row.tokenId,
      name: row.name,
      image: toImage(art.path),
      category: row.category,
      network: row.network,
      rarity: rarityOf[row.rarity],
      collection: {
        id: row.collection,
        name: collection.name,
        creator: { id: collection.creator, name: creators[collection.creator as keyof typeof creators] },
        royaltyPercent: collection.royalty,
      },
      price: row.price,
      previousPrice: row.previousPrice ?? null,
      soldOut: row.soldOut ?? false,
      createdAt: new Date(MOCK_NOW - index * 30 * HOUR).toISOString(),
      version: 1,
      summary: row.summary ?? `Obra digital da coleção ${collection.name}, verificada na rede ${row.network}.`,
      description: `${row.name} faz parte da coleção ${collection.name}, ${collection.blurb}. Cada atributo fica armazenado nos metadados do token.`,
      gallery: Array.from({ length: 4 }, () => toImage(art.path)),
      traits: row.traits ?? [
        { type: 'Acessório', value: art.accessory },
        { type: 'Roupa', value: art.outfit },
        { type: 'Raridade', value: row.rarity },
      ],
      rating: {
        average: Math.round((stars.reduce((sum, s) => sum + s, 0) / stars.length) * 10) / 10,
        count: stars.length,
      },
      editions,
      contract: {
        address: collection.contract,
        standard: row.network === 'solana' ? 'Metaplex' : 'ERC-721',
        verified: true,
      },
      maxPerOrder: 10,
    })

    stars.forEach((rating, i) => {
      const author = reviewers[(token + i) % reviewers.length]
      reviews.push({
        id: `${id}-r${i + 1}`,
        nftId: id,
        author,
        rating,
        body: reviewTexts[(token + i * 3) % reviewTexts.length],
        createdAt: new Date(MOCK_NOW - (i + 1) * 36 * HOUR).toISOString(),
      })
    })
  })

  return { nfts, reviews }
}

export const trendingIds = new Set(rows.filter((r) => r.trending).map((r) => slugify(r.name)))

export function getFeatured(nfts: Nft[]) {
  return rows.filter((r) => r.featured).flatMap((r) => featuredItemOf(nfts, r))
}

export function getSpotlight(nfts: Nft[]) {
  const row = rows.find((r) => r.spotlight)
  return row ? featuredItemOf(nfts, row)[0] : undefined
}

function featuredItemOf(nfts: Nft[], row: Row) {
  const nft = nfts.find((n) => n.id === slugify(row.name))
  return nft ? [{ nft, badge: row.badge ?? null }] : []
}
