import { queryOptions } from '@tanstack/react-query'
import { getOrder, listOrders } from './api'
import type { OrderStatus } from './schema'

export const ordersKey = (userId: string) => ['user', userId, 'orders'] as const

export const orderKey = (userId: string, id: string) => [...ordersKey(userId), id] as const

export const orderQuery = (userId: string, id: string) =>
  queryOptions({
    queryKey: orderKey(userId, id),
    queryFn: ({ signal }) => getOrder(id, signal),
  })

export const ordersQuery = (userId: string, status?: OrderStatus) =>
  queryOptions({
    queryKey: [...ordersKey(userId), 'list', status ?? 'all'] as const,
    queryFn: ({ signal }) => listOrders(status, signal),
  })
