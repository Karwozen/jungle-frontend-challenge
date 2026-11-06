import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import SearchField from './catalog/toolbar/search-field'

// no mobile o catálogo fica abaixo do hero, então ao buscar leva a pessoa até os resultados
function revealResults() {
  const catalog = document.getElementById('catalogo')
  if (catalog && catalog.getBoundingClientRect().top > window.innerHeight * 0.2) catalog.scrollIntoView()
}

function MobileSearchBar({ onOpenFilters }: { onOpenFilters: () => void }) {
  return (
    <div className="sticky top-0 z-30 flex items-center gap-3 bg-background/80 px-6 py-3 backdrop-blur-md md:hidden">
      <SearchField
        placeholder="Explorar coleções"
        onSearch={revealResults}
        className="flex-1"
        inputClassName="border-transparent bg-card"
      />
      <Button
        size="icon-lg"
        aria-label="Abrir filtros"
        data-filters-trigger
        onClick={onOpenFilters}
        className="size-10 bg-linear-to-br from-primary to-[color-mix(in_oklab,var(--primary),black_30%)]"
      >
        <SlidersHorizontal />
      </Button>
    </div>
  )
}

export default MobileSearchBar
