import { http, HttpResponse } from 'msw'
import {
  connectRequest,
  createWalletRequest,
  wallet,
  walletInput,
} from '@/domain/wallets/schema'
import { requireSession } from '@/mocks/auth'
import { getDb, saveDb } from '@/mocks/db'
import { apiError, notFound, validationError } from '@/mocks/responses'
import { getScenario, simulate } from '@/mocks/scenarios'

function ownedWallet(id: string, userId: string) {
  const found = getDb().wallets.find((w) => w.id === id)
  if (!found) return notFound('Carteira')
  if (found.userId !== userId) return apiError(403, 'FORBIDDEN', 'Você não tem acesso a esta carteira.')
  return found
}

function addressTaken(address: string, exceptId?: string) {
  return getDb().wallets.some(
    (w) => w.id !== exceptId && w.address.toLowerCase() === address.toLowerCase(),
  )
}

const addressConflict = () =>
  apiError(409, 'CONFLICT', 'Este endereço já está cadastrado.', {
    fields: { address: 'Este endereço já está cadastrado' },
  })

export const walletsHandlers = [
  http.get('/api/wallets', async ({ request }) => {
    const failure = await simulate('wallets')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    const mine = getDb().wallets.filter((w) => w.userId === auth.user.id)
    return HttpResponse.json(wallet.array().parse(mine))
  }),

  http.post('/api/wallets', async ({ request }) => {
    const failure = await simulate('wallets')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    const parsed = createWalletRequest.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    const db = getDb()
    const { role, address } = parsed.data
    if (db.wallets.some((w) => w.userId === auth.user.id && w.role === role)) {
      const message = role === 'primary' ? 'Você já tem uma carteira principal' : 'Você já tem uma carteira secundária'
      return apiError(409, 'CONFLICT', message, { fields: { role: message } })
    }
    if (addressTaken(address)) return addressConflict()

    const created = {
      ...parsed.data,
      id: `wal_${crypto.randomUUID().slice(0, 8)}`,
      userId: auth.user.id,
      connection: null,
    }
    db.wallets.push(created)
    saveDb()
    return HttpResponse.json(wallet.parse(created), { status: 201 })
  }),

  http.put('/api/wallets/:id', async ({ request, params }) => {
    const failure = await simulate('wallets')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    const found = ownedWallet(String(params.id), auth.user.id)
    if (found instanceof Response) return found

    const parsed = walletInput.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)
    if (addressTaken(parsed.data.address, found.id)) return addressConflict()

    Object.assign(found, parsed.data)
    saveDb()
    return HttpResponse.json(wallet.parse(found))
  }),

  http.post('/api/wallets/:id/connect', async ({ request, params }) => {
    const failure = await simulate('wallets')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    const found = ownedWallet(String(params.id), auth.user.id)
    if (found instanceof Response) return found

    if (getScenario('wallets') === 'wallet-rejected') {
      return apiError(403, 'WALLET_REJECTED', 'A carteira recusou a conexão.')
    }

    const parsed = connectRequest.safeParse(await request.json())
    if (!parsed.success) return validationError(parsed.error)

    found.connection = { network: parsed.data.network, connectedAt: new Date().toISOString() }
    saveDb()
    return HttpResponse.json(found.connection)
  }),

  http.post('/api/wallets/:id/disconnect', async ({ request, params }) => {
    const failure = await simulate('wallets')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    const found = ownedWallet(String(params.id), auth.user.id)
    if (found instanceof Response) return found

    found.connection = null
    saveDb()
    return new HttpResponse(null, { status: 204 })
  }),
]
