import { delay, http, HttpResponse } from 'msw'
import { requestUser } from './account'

const KEY = 'kurio.mock.favorites.v1'
const FAILURE_KEY = 'kurio.mock.favorites.failure'

type FavoriteStore = Record<string, string[]>

const read = (): FavoriteStore => JSON.parse(localStorage.getItem(KEY) || '{}') as FavoriteStore
const write = (store: FavoriteStore) => localStorage.setItem(KEY, JSON.stringify(store))
export const resetFavorites = () => {
  localStorage.removeItem(KEY)
  localStorage.removeItem(FAILURE_KEY)
}

const unauthorized = () => HttpResponse.json({ message: 'Entre novamente para favoritar NFTs.', code: 'SESSION_EXPIRED' }, { status: 401 })

export const favoriteHandlers = [
  http.get('/api/favorites', async ({ request }) => {
    const user = await requestUser(request)
    if (!user) return unauthorized()
    return HttpResponse.json(read()[user.id] || [])
  }),
  http.put('/api/favorites/:nftId', async ({ request, params }) => {
    const user = await requestUser(request)
    if (!user) return unauthorized()
    if (localStorage.getItem(FAILURE_KEY) === 'true') {
      localStorage.removeItem(FAILURE_KEY)
      await delay(350)
      return HttpResponse.json({ message: 'Não foi possível salvar seu favorito. Tente novamente.', code: 'TRANSIENT_FAILURE' }, { status: 503 })
    }
    const store = read(), favorites = store[user.id] ||= [], nftId = String(params.nftId)
    if (!favorites.includes(nftId)) favorites.push(nftId)
    write(store)
    return HttpResponse.json(favorites)
  }),
  http.delete('/api/favorites/:nftId', async ({ request, params }) => {
    const user = await requestUser(request)
    if (!user) return unauthorized()
    const store = read(), nftId = String(params.nftId)
    store[user.id] = (store[user.id] || []).filter(id => id !== nftId)
    write(store)
    return HttpResponse.json(store[user.id])
  }),
  http.post('/api/demo/favorites-fail-next', () => {
    localStorage.setItem(FAILURE_KEY, 'true')
    return HttpResponse.json({ ok: true })
  }),
]
