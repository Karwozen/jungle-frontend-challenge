import { useQuery } from '@tanstack/react-query'
import { catalogListQuery } from '@/domain/catalog/queries'
import CatalogFilters from './filters'
import CatalogPagination from './catalog-pagination'
import CatalogToolbar from './toolbar'
import FeaturedNft from './featured-nft'
import FiltersDrawer from './filters/filters-drawer'
import NftGrid from './nft-grid'
import { useCatalogSearch } from '@/features/catalog/use-catalog-search'

const PAGE_SIZE = 9

interface CatalogSectionProps {
  filtersOpen: boolean
  onFiltersOpenChange: (open: boolean) => void
}

function CatalogSection({ filtersOpen, onFiltersOpenChange }: CatalogSectionProps) {
  const { search, query } = useCatalogSearch()
  const { data, isError, isPlaceholderData, refetch } = useQuery(catalogListQuery(query))

  return (
    <section id="catalogo" aria-label="Catálogo" className="mx-auto mt-16 w-full max-w-300 scroll-mt-4 px-6 xl:px-0">
      <div className="grid gap-10 lg:grid-cols-[18.75rem_1fr]">
        <aside className="hidden lg:flex lg:flex-col">
          <div className="rounded-lg bg-card p-6">
            <CatalogFilters facets={data?.facets} failed={isError && !data} />
          </div>
          <FeaturedNft />
        </aside>

        <div>
          <CatalogToolbar onOpenFilters={() => onFiltersOpenChange(true)} />
          <p role="status" className="sr-only">
            {data && !isPlaceholderData ? `${data.total} NFTs encontrados` : ''}
          </p>
          <div className="mt-6">
            <NftGrid
              page={data}
              pageSize={PAGE_SIZE}
              isError={isError}
              isStale={isPlaceholderData}
              onRetry={() => refetch()}
            />
          </div>
        </div>
      </div>

      {data && <CatalogPagination page={search.page ?? 1} totalPages={data.totalPages} />}

      <FiltersDrawer open={filtersOpen} onOpenChange={onFiltersOpenChange} facets={data?.facets} failed={isError && !data} />
    </section>
  )
}

export default CatalogSection
