import { api } from '../../shared/api'

export function favoriteQuery(userId: string | undefined) {
  return {
    queryKey: ['private', userId, 'favorites'] as const,
    queryFn: async ({ signal }: { signal: AbortSignal }) => (await api.get<string[]>('/favorites', { signal })).data,
    enabled: Boolean(userId),
    retry: false,
  }
}
