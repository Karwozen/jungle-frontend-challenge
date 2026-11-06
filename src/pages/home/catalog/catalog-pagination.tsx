import { ChevronLeft, ChevronRight } from 'lucide-react'
import PaginationLink from './pagination-link'

function CatalogPagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null

  return (
    <nav aria-label="Paginação" className="mt-10 flex justify-center gap-2 md:justify-end">
      {page > 1 && (
        <PaginationLink page={page - 1} label="Página anterior">
          <ChevronLeft className="size-4" />
        </PaginationLink>
      )}
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
        <PaginationLink key={n} page={n} label={`Página ${n}`} current={n === page}>
          {n}
        </PaginationLink>
      ))}
      {page < totalPages && (
        <PaginationLink page={page + 1} label="Próxima página">
          <ChevronRight className="size-4" />
        </PaginationLink>
      )}
    </nav>
  )
}

export default CatalogPagination
