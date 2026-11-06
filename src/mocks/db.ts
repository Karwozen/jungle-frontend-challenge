import type { ArticleSummary } from '@/domain/articles/schema'
import type { CartLine } from '@/domain/cart/schema'
import type { Nft, Review } from '@/domain/catalog/schema'
import type { Order } from '@/domain/orders/schema'
import type { Quote } from '@/domain/quote/schema'
import { storage } from '@/lib/storage'
import { buildArticles } from '@/mocks/data/articles'
import { buildCatalog } from '@/mocks/data/catalog'
import { createUsers, type StoredUser } from '@/mocks/fixtures/users'
import { createWallets, initialFavorites, type WalletRecord } from '@/mocks/fixtures/wallets'

// Versão do schema local para invalidar automaticamente estados antigos salvos no navegador
const KEY = 'kurio.mock.db.v13'

export type ReviewRecord = Review & { nftId: string }

export type CartRecord = CartLine & { id: string; addedPrice: string }

export interface StoredCart {
  items: CartRecord[]
  coupon: string | null
}

export type OrderRecord = Order & {
  userId: string
  idempotencyKey: string
  fingerprint: string
  outcome: 'confirmed' | 'refused'
  // null: só resolve quando o teste mandar (cenário manual-settlement)
  settleAt: number | null
}

export interface StoredSession {
  token: string
  userId: string
  expiresAt: string
}

export interface Db {
  nfts: Nft[]
  reviews: ReviewRecord[]
  articles: ArticleSummary[]
  users: StoredUser[]
  sessions: StoredSession[]
  favorites: Record<string, string[]>
  wallets: WalletRecord[]
  carts: Record<string, StoredCart>
  quotes: Quote[]
  orders: OrderRecord[]
}

let cache: Db | null = null

function seed(): Db {
  return {
    ...buildCatalog(),
    articles: buildArticles(),
    users: createUsers(),
    sessions: [],
    favorites: initialFavorites,
    wallets: createWallets(),
    carts: {},
    quotes: [],
    orders: [],
  }
}

function load(): Db {
  const raw = storage.get(KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as Db
    } catch {
      // dado corrompido, volta para o seed
    }
  }
  return seed()
}

export function getDb(): Db {
  cache ??= load()
  return cache
}

export function saveDb() {
  storage.set(KEY, JSON.stringify(getDb()))
}

export function resetDb() {
  cache = seed()
  saveDb()
}
