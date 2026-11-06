import { Link } from '@tanstack/react-router'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { CatalogQuery } from '@/domain/catalog/schema'
import { cn } from '@/lib/utils'
import { sortLabels, tabLabels } from '@/features/catalog/labels'
import SearchField from './search-field'
import { tabs } from '@/features/catalog/search'
import { useCatalogSearch } from '@/features/catalog/use-catalog-search'

function CatalogToolbar({ onOpenFilters }: { onOpenFilters: () => void }) {
  const { search, update } = useCatalogSearch()
  const tab = search.tab ?? 'all'

  return (
    <div className="space-y-4">
      <SearchField className="max-md:hidden" />
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
        <nav aria-label="Listagem" className="flex gap-4 text-xs">
          {tabs.map((key) => (
            <Link
              key={key}
              to="."
              search={(prev) => ({ ...prev, tab: key === 'all' ? undefined : key, page: undefined })}
              resetScroll={false}
              aria-current={tab === key ? 'page' : undefined}
              className={cn(
                'py-1 outline-none focus-visible:ring-3 focus-visible:ring-ring/50',
                tab === key ? 'border-b-2 border-text-accent text-text-accent' : 'hover:text-text-accent',
              )}
            >
              {tabLabels[key]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={onOpenFilters} data-filters-trigger className="max-md:hidden lg:hidden">
            <SlidersHorizontal />
            Filtros
          </Button>
          <div className="flex items-center gap-2 text-xs">
            <span aria-hidden className="hidden sm:inline">
              Ordenar por:
            </span>
            <Select
              value={search.sort ?? 'recent'}
              onValueChange={(sort) => update({ sort: sort as NonNullable<CatalogQuery['sort']> })}
            >
              <SelectTrigger aria-label="Ordenar por" size="sm" className="min-w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent align="end">
                {Object.entries(sortLabels).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CatalogToolbar
