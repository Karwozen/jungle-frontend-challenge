import { http, HttpResponse } from 'msw'
import { createOrderRequest, order, orderStatuses } from '@/domain/orders/schema'
import { mulEth } from '@/lib/eth'
import { requireSession } from '@/mocks/auth'
import { getDb, saveDb, type OrderRecord } from '@/mocks/db'
import { repriceNft, touchNft } from '@/mocks/nfts'
import { SETTLE_AFTER_MS, scheduleSettlement, settleDue } from '@/mocks/orders'
import { buildQuote, createQuote, detectChanges, findEdition } from '@/mocks/quote'
import { apiError, notFound, validationError } from '@/mocks/responses'
import { getScenario, setScenario, simulate, sleep } from '@/mocks/scenarios'

// cenários de uma vez só: alteram o catálogo antes da revalidação para a compra falhar de verdade
function disturbCatalog(items: { nftId: string; editionId: string }[]) {
  const scenario = getScenario('orders')
  const first = items[0] && findEdition(items[0].nftId, items[0].editionId)
  if (!first) return

  if (scenario === 'price-changed') {
    repriceNft(first.nft, mulEth(first.nft.price, 1.1))
    setScenario('default')
  } else if (scenario === 'sold-out') {
    first.edition.available = 0
    touchNft(first.nft)
    setScenario('default')
  }
}

export const ordersHandlers = [
  http.post('/api/orders', async ({ request }) => {
    const failure = await simulate('orders')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    const key = request.headers.get('Idempotency-Key')
    if (!key) return apiError(422, 'VALIDATION', 'Informe o cabeçalho Idempotency-Key.')

    const parsed = createOrderRequest.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const db = getDb()
    const fingerprint = JSON.stringify(parsed.data)
    const previous = db.orders.find((o) => o.userId === auth.user.id && o.idempotencyKey === key)
    if (previous) {
      if (previous.fingerprint !== fingerprint) {
        return apiError(409, 'IDEMPOTENCY_CONFLICT', 'Esta chave já foi usada em outro pedido.')
      }
      settleDue()
      return HttpResponse.json(order.parse(previous))
    }

    const { quoteId, walletId, network, note } = parsed.data

    const stored = db.quotes.find((q) => q.id === quoteId)
    if (!stored) return notFound('Cotação')
    if (Date.parse(stored.expiresAt) <= Date.now()) {
      return apiError(409, 'QUOTE_EXPIRED', 'A cotação expirou. Revise o pedido.')
    }

    const wallet = db.wallets.find((w) => w.id === walletId)
    if (!wallet) return notFound('Carteira')
    if (wallet.userId !== auth.user.id) {
      return apiError(403, 'FORBIDDEN', 'Você não tem acesso a esta carteira.')
    }
    if (wallet.connection?.network !== network) {
      return apiError(409, 'WALLET_NOT_CONNECTED', 'Conecte a carteira na rede selecionada.')
    }

    disturbCatalog(stored.items)

    // refaz a conta com o que está valendo agora e compara com o que o usuário revisou
    const lines = stored.items.map(({ nftId, editionId, quantity }) => ({ nftId, editionId, quantity }))
    let couponLost = false
    let fresh = buildQuote(lines, stored.coupon?.code)
    if (fresh instanceof Response && stored.coupon) {
      couponLost = true
      fresh = buildQuote(lines)
    }
    if (fresh instanceof Response) return fresh

    if (fresh.items.some((i) => i.issue)) {
      return apiError(409, 'AVAILABILITY_CONFLICT', 'Alguns itens não estão mais disponíveis.', {
        details: { quote: createQuote(fresh) },
      })
    }
    const changes = detectChanges(stored, fresh, couponLost)
    if (changes.length) {
      return apiError(409, 'QUOTE_STALE', 'Os valores do pedido mudaram.', {
        details: { changes, quote: createQuote(fresh) },
      })
    }

    const now = Date.now()
    const created: OrderRecord = {
      id: `ord_${crypto.randomUUID().slice(0, 8)}`,
      status: 'pending',
      version: 1,
      createdAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString(),
      items: stored.items.map((line) => {
        const { nft } = findEdition(line.nftId, line.editionId)!
        return {
          nftId: line.nftId,
          editionId: line.editionId,
          quantity: line.quantity,
          name: nft.name,
          image: nft.image,
          unitPrice: line.unitPrice,
          total: line.total,
        }
      }),
      coupon: stored.coupon,
      subtotal: stored.subtotal,
      discount: stored.discount,
      networkFee: stored.networkFee,
      total: stored.total,
      network,
      wallet: { displayName: wallet.displayName, provider: wallet.provider, address: wallet.address },
      note: note || null,
      txHash: null,
      explorerUrl: null,
      failureReason: null,
      userId: auth.user.id,
      idempotencyKey: key,
      fingerprint,
      outcome: getScenario('orders') === 'payment-refused' ? 'refused' : 'confirmed',
      settleAt: getScenario('orders') === 'manual-settlement' ? null : now + SETTLE_AFTER_MS,
    }
    db.orders.push(created)
    saveDb()
    scheduleSettlement(created)

    // a resposta chega depois do timeout do cliente, mas o pedido já foi criado
    if (getScenario('orders') === 'order-timeout') {
      setScenario('default')
      await sleep(15_000)
    }

    return HttpResponse.json(order.parse(created), { status: 201 })
  }),

  http.get('/api/orders', async ({ request }) => {
    const failure = await simulate('orders')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    const status = new URL(request.url).searchParams.get('status')
    if (status && !orderStatuses.includes(status as (typeof orderStatuses)[number])) {
      return apiError(422, 'VALIDATION', 'Status inválido.', { fields: { status: 'Status inválido' } })
    }

    settleDue()
    const mine = getDb()
      .orders.filter((o) => o.userId === auth.user.id && (!status || o.status === status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return HttpResponse.json(order.array().parse(mine))
  }),

  http.get('/api/orders/:id', async ({ request, params }) => {
    const failure = await simulate('orders')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    settleDue()
    const found = getDb().orders.find((o) => o.id === params.id)
    if (!found) return notFound('Pedido')
    if (found.userId !== auth.user.id) {
      return apiError(403, 'FORBIDDEN', 'Você não tem acesso a este pedido.')
    }
    return HttpResponse.json(order.parse(found))
  }),
]
