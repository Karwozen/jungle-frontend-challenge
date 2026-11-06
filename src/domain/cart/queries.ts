import { queryOptions } from '@tanstack/react-query'
import { getCart } from './api'

export const cartKey = (userId: string) => ['user', userId, 'cart'] as const

export const cartQuery = (userId: string) =>
  queryOptions({
    queryKey: cartKey(userId),
    queryFn: ({ signal }) => getCart(signal),
    staleTime: 30_000,
  })
