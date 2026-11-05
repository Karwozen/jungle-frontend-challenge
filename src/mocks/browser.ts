import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { accountHandlers } from './account'
import { cartHandlers } from './cart'
import { orderHandlers } from './orders'
import { favoriteHandlers } from './favorites'
import { networkHandlers } from './network'
export const worker = setupWorker(...networkHandlers, ...handlers, ...accountHandlers, ...cartHandlers, ...orderHandlers, ...favoriteHandlers)
