import { http, HttpResponse } from 'msw'
import { requireSession } from '@/mocks/auth'
import { getDb, saveDb } from '@/mocks/db'
import { notFound } from '@/mocks/responses'
import { simulate } from '@/mocks/scenarios'

export const favoritesHandlers = [
  http.get('/api/favorites', async ({ request }) => {
    const failure = await simulate('favorites')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth
    return HttpResponse.json({ nftIds: getDb().favorites[auth.user.id] ?? [] })
  }),

  http.put('/api/favorites/:nftId', async ({ request, params }) => {
    const failure = await simulate('favorites')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    const db = getDb()
    const nftId = String(params.nftId)
    if (!db.nfts.some((n) => n.id === nftId)) return notFound('NFT')

    const current = db.favorites[auth.user.id] ?? []
    if (!current.includes(nftId)) db.favorites[auth.user.id] = [...current, nftId]
    saveDb()
    return new HttpResponse(null, { status: 204 })
  }),

  http.delete('/api/favorites/:nftId', async ({ request, params }) => {
    const failure = await simulate('favorites')
    if (failure) return failure

    const auth = requireSession(request)
    if (auth instanceof Response) return auth

    const db = getDb()
    db.favorites[auth.user.id] = (db.favorites[auth.user.id] ?? []).filter((id) => id !== params.nftId)
    saveDb()
    return new HttpResponse(null, { status: 204 })
  }),
]
