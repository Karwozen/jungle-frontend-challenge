import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

interface PaginationLinkProps {
  page: number
  label: string
  current?: boolean
  children: ReactNode
}

function PaginationLink({ page, label, current, children }: PaginationLinkProps) {
  return (
    <Link
      to="."
      search={(prev) => ({ ...prev, page: page > 1 ? page : undefined })}
      hash="catalogo"
      aria-label={label}
      aria-current={current ? 'page' : undefined}
      className={cn(
        'flex size-8 items-center justify-center rounded-sm border border-card bg-background text-xs outline-none hover:text-text-accent focus-visible:ring-3 focus-visible:ring-ring/50',
        current && 'border-primary bg-primary font-bold text-primary-foreground hover:text-primary-foreground',
      )}
    >
      {children}
    </Link>
  )
}

export default PaginationLink
