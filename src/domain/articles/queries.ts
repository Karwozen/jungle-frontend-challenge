import { queryOptions } from '@tanstack/react-query'
import { listArticles } from './api'

export const articlesKeys = {
  list: (page: number, pageSize: number) => ['articles', 'list', page, pageSize] as const,
}

export const articlesQuery = (page = 1, pageSize = 6) =>
  queryOptions({
    queryKey: articlesKeys.list(page, pageSize),
    queryFn: ({ signal }) => listArticles({ page, pageSize }, signal),
    staleTime: 5 * 60_000,
  })
