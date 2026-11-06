import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { getQuote } from './api'
import type { QuoteRequest } from './schema'

export const quoteKey = (request: QuoteRequest) => ['quote', request] as const

export const quoteQuery = (request: QuoteRequest) =>
  queryOptions({
    queryKey: quoteKey(request),
    queryFn: ({ signal }) => getQuote(request, signal),
    staleTime: 0,
    placeholderData: keepPreviousData,
  })
