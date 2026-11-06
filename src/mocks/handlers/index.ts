import { http, HttpResponse } from 'msw'
import { articlesHandlers } from './articles'
import { authHandlers } from './auth'
import { cartHandlers } from './cart'
import { realtimeHandlers } from '@/mocks/realtime'
import { catalogHandlers } from './catalog'
import { controlHandlers } from './control'
import { favoritesHandlers } from './favorites'
import { ordersHandlers } from './orders'
import { profileHandlers } from './profile'
import { quoteHandlers } from './quote'
import { walletsHandlers } from './wallets'

export const handlers = [
  http.get('/api/health', () => HttpResponse.json({ status: 'ok' })),
  ...authHandlers,
  ...articlesHandlers,
  ...catalogHandlers,
  ...favoritesHandlers,
  ...cartHandlers,
  ...quoteHandlers,
  ...ordersHandlers,
  ...profileHandlers,
  ...walletsHandlers,
  ...controlHandlers,
  ...realtimeHandlers,
]
