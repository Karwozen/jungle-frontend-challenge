import { useCallback } from 'react'
import { useNavigate, useSearch } from '@tanstack/react-router'
import { toCatalogQuery, type CatalogSearch } from './search'

export function useCatalogSearch() {
  const search = useSearch({ from: '/' })
  const navigate = useNavigate({ from: '/' })

  const update = useCallback(
    (patch: Partial<CatalogSearch>, options: { replace?: boolean } = {}) =>
      navigate({
        search: (prev) => ({ ...prev, ...patch, page: undefined }),
        replace: options.replace,
        resetScroll: false,
      }),
    [navigate],
  )

  return { search, query: toCatalogQuery(search), update }
}
