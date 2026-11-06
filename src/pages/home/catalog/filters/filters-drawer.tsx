import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import type { CatalogPage } from '@/domain/catalog/schema'
import CatalogFilters from './catalog-filters'

interface FiltersDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  facets?: CatalogPage['facets']
  failed?: boolean
}

function FiltersDrawer({ open, onOpenChange, facets, failed }: FiltersDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="left"
        className="overflow-y-auto border-border-soft bg-card p-6"
        onCloseAutoFocus={(event) => {
          // o drawer abre por estado, não por um gatilho do Radix: devolve o foco ao botão que está visível
          event.preventDefault()
          const triggers = Array.from(document.querySelectorAll<HTMLElement>('[data-filters-trigger]'))
          triggers.find((trigger) => trigger.offsetParent !== null)?.focus()
        }}
      >
        <SheetHeader className="p-0">
          <SheetTitle>Filtros</SheetTitle>
          <SheetDescription className="sr-only">Filtre o catálogo por coleção, preço e rede.</SheetDescription>
        </SheetHeader>
        <CatalogFilters facets={facets} failed={failed} />
      </SheetContent>
    </Sheet>
  )
}

export default FiltersDrawer
