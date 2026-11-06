import { queryOptions } from '@tanstack/react-query'
import { getFavorites } from './api'

// a chave leva o usuário para um login não herdar o cache do anterior
export const favoritesKey = (userId: string) => ['user', userId, 'favorites'] as const

export const favoritesQuery = (userId: string) =>
  queryOptions({
    queryKey: favoritesKey(userId),
    queryFn: ({ signal }) => getFavorites(signal),
    staleTime: 60_000,
  })
