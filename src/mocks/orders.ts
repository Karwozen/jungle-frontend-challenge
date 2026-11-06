import type { Nft, Network } from '@/domain/catalog/schema'
import { getDb, saveDb, type OrderRecord } from '@/mocks/db'
import { touchNft } from '@/mocks/nfts'
import { findEdition } from '@/mocks/quote'
import { publishOrder } from '@/mocks/realtime'

export const SETTLE_AFTER_MS = 3000

const explorers: Record<Network, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  solana: 'https://solscan.io/tx/',
}

function newTxHash() {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return `0x${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`
}

function refusalReason(record: OrderRecord) {
  if (record.outcome === 'refused') return 'A carteira recusou o pagamento. Nada foi cobrado.'

  const soldOut = record.items.some((item) => {
    const available = findEdition(item.nftId, item.editionId)?.edition.available
    return available != null && available < item.quantity
  })
  return soldOut ? 'Uma das edições esgotou antes da confirmação. Nada foi cobrado.' : null
}

function applyPurchase(record: OrderRecord) {
  const mine = getDb().carts[record.userId]
  const touched = new Set<Nft>()

  for (const item of record.items) {
    const found = findEdition(item.nftId, item.editionId)
    if (found) {
      if (found.edition.available !== null) found.edition.available -= item.quantity
      touched.add(found.nft)
    }

    const inCart = mine?.items.find((c) => c.nftId === item.nftId && c.editionId === item.editionId)
    if (inCart) inCart.quantity -= item.quantity
  }

  if (mine) {
    mine.items = mine.items.filter((c) => c.quantity > 0)
    if (!mine.items.length) mine.coupon = null
  }
  for (const nft of touched) touchNft(nft)
}

export function settleOrder(record: OrderRecord, outcome?: OrderRecord['outcome']) {
  if (record.status !== 'pending') return
  if (outcome) record.outcome = outcome

  const reason = refusalReason(record)
  record.version++
  record.updatedAt = new Date().toISOString()
  if (reason) {
    record.status = 'refused'
    record.failureReason = reason
  } else {
    record.status = 'confirmed'
    record.txHash = newTxHash()
    record.explorerUrl = explorers[record.network] + record.txHash
    applyPurchase(record)
  }
  saveDb()
  publishOrder(record)
}

// Liquida todos os pedidos pendentes cujo timestamp de processamento já foi atingido
export function settleDue() {
  const now = Date.now()
  for (const record of getDb().orders) {
    if (record.settleAt !== null && record.settleAt <= now) settleOrder(record)
  }
}

// Agenda a liquidação assíncrona do pedido para emitir o evento order.updated no momento previsto
export function scheduleSettlement(record: OrderRecord) {
  if (record.settleAt === null) return
  setTimeout(settleDue, Math.max(0, record.settleAt - Date.now()) + 50)
}
