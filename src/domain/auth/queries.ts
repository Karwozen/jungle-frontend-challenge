import { queryOptions } from '@tanstack/react-query'
import { getSession } from './api'

export const sessionKey = ['session'] as const

export const sessionQuery = queryOptions({
  queryKey: sessionKey,
  queryFn: ({ signal }) => getSession(signal),
  retry: false,
  staleTime: 5 * 60_000,
})
