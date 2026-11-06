import type { CartLine } from '@/domain/cart/schema'
import type { Quote, QuoteChange, QuoteLine } from '@/domain/quote/schema'
import { addEth, compareEth, mulEth, percentOfEth, subEth } from '@/lib/eth'
import { getDb, saveDb } from '@/mocks/db'
import { coupons, NETWORK_FEE } from '@/mocks/fixtures/coupons'
import { apiError, notFound } from '@/mocks/responses'

const QUOTE_TTL_MS = 5 * 60_000
const MAX_QUOTES = 20

export type QuoteDraft = Omit<Quote, 'id' | 'expiresAt'>

export function findEdition(nftId: string, editionId: string) {
  const nft = getDb().nfts.find((n) => n.id === nftId)
  const edition = nft?.editions.find((e) => e.id === editionId)
  return nft && edition ? { nft, edition } : undefined
}

function lineIssue(line: CartLine, available: number | null, maxPerOrder: number): QuoteLine['issue'] {
  if (available === 0) return 'sold-out'
  if (available === null) return line.quantity > maxPerOrder ? 'over-limit' : null
  return line.quantity > available ? 'insufficient-stock' : null
}

export function findCoupon(code: string | undefined | null) {
  if (!code) return null
  const found = coupons.find((c) => c.code === code.toUpperCase())
  if (!found) {
    return apiError(422, 'COUPON_INVALID', 'Cupom inválido.', { fields: { coupon: 'Cupom inválido' } })
  }
  if (Date.parse(found.expiresAt) <= Date.now()) {
    return apiError(422, 'COUPON_EXPIRED', 'Este cupom expirou.', { fields: { coupon: 'Este cupom expirou' } })
  }
  return found
}

export function buildQuote(lines: CartLine[], code?: string | null): QuoteDraft | Response {
  const coupon = findCoupon(code)
  if (coupon instanceof Response) return coupon

  const items: QuoteLine[] = []
  for (const line of lines) {
    const found = findEdition(line.nftId, line.editionId)
    if (!found) return notFound('NFT')

    items.push({
      ...line,
      unitPrice: found.edition.price,
      total: mulEth(found.edition.price, line.quantity),
      available: found.edition.available,
      nftVersion: found.nft.version,
      issue: lineIssue(line, found.edition.available, found.nft.maxPerOrder),
    })
  }

  const subtotal = items.reduce((sum, i) => addEth(sum, i.total), '0')
  const discount = coupon ? percentOfEth(subtotal, coupon.percent) : '0'
  const networkFee = items.length ? NETWORK_FEE : '0'

  return {
    items,
    coupon: coupon && { code: coupon.code, percent: coupon.percent },
    subtotal,
    discount,
    networkFee,
    total: addEth(subEth(subtotal, discount), networkFee),
  }
}

// mantém só as últimas 20 para o banco não crescer a cada mudança no carrinho
export function createQuote(draft: QuoteDraft): Quote {
  const created: Quote = {
    ...draft,
    id: `qte_${crypto.randomUUID().slice(0, 8)}`,
    expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(),
  }
  const db = getDb()
  db.quotes = [...db.quotes, created].slice(-MAX_QUOTES)
  saveDb()
  return created
}

export function detectChanges(before: Quote, after: QuoteDraft, couponLost: boolean): QuoteChange[] {
  const changes: QuoteChange[] = []
  if (before.items.some((b, i) => compareEth(b.unitPrice, after.items[i].unitPrice) !== 0)) {
    changes.push('price')
  }
  if (compareEth(before.networkFee, after.networkFee) !== 0) changes.push('fee')
  if (couponLost || before.coupon?.percent !== after.coupon?.percent) changes.push('coupon')
  return changes
}
