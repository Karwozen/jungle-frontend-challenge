import type { CatalogPage } from '@/domain/catalog/schema'
import FilterGroup from './filter-group'
import { categoryLabels, networkLabels } from '@/features/catalog/labels'
import PriceFilter from './price-filter'
import { useCatalogSearch } from '@/features/catalog/use-catalog-search'

function CatalogFilters({ facets, failed }: { facets?: CatalogPage['facets']; failed?: boolean }) {
  const { search, update } = useCatalogSearch()

  return (
    <>
      <FilterGroup
        title="Coleções"
        options={categoryLabels}
        counts={facets?.categories}
        selected={search.categories}
        onChange={(categories) => update({ categories })}
      />
      <PriceFilter range={facets?.price} failed={failed || (!!facets && facets.price === undefined)} />
      <FilterGroup
        title="Rede"
        options={networkLabels}
        counts={facets?.networks}
        selected={search.networks}
        onChange={(networks) => update({ networks })}
      />
    </>
  )
}

export default CatalogFilters
