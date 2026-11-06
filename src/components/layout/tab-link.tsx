import type { ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

interface TabLinkProps {
  to: '/' | '/favorites' | '/cart' | '/profile'
  label: string
  children: ReactNode
}

function TabLink({ to, label, children }: TabLinkProps) {
  return (
    <Link
      to={to}
      aria-label={label}
      activeOptions={{ exact: to === '/', includeSearch: false }}
      className="flex h-full items-center justify-center text-text-secondary outline-none focus-visible:text-text-accent data-[status=active]:text-text-accent"
    >
      {children}
    </Link>
  )
}

export default TabLink
