import { queryOptions } from '@tanstack/react-query'
import { getProfile } from './api'

export const profileKey = (userId: string) => ['user', userId, 'profile'] as const

export const profileQuery = (userId: string) =>
  queryOptions({
    queryKey: profileKey(userId),
    queryFn: ({ signal }) => getProfile(signal),
    staleTime: 5 * 60_000,
  })
