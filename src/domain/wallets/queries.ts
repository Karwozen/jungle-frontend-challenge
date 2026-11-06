import { queryOptions } from '@tanstack/react-query'
import { listWallets } from './api'

export const walletsKey = (userId: string) => ['user', userId, 'wallets'] as const

export const walletsQuery = (userId: string) =>
  queryOptions({
    queryKey: walletsKey(userId),
    queryFn: ({ signal }) => listWallets(signal),
    staleTime: 5 * 60_000,
  })
