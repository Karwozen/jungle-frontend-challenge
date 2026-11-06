import type { MouseEvent, ReactNode } from 'react'
import { useLinkProps } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  hash?: string
  current: boolean
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void
  children: ReactNode
}

// o router marcaria Início e Mercado como página atual ao mesmo tempo, aqui só o item em foco é
function NavLink({ hash, current, onClick, children }: NavLinkProps) {
  const { onClick: goTo, ...props } = useLinkProps({ to: '/', hash })

  return (
    <a
      {...props}
      data-active={current}
      aria-current={current ? 'location' : undefined}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) goTo?.(event)
      }}
      className={cn(
        'flex h-14 items-center px-1 text-sm outline-none focus-visible:text-text-accent',
        current && 'text-text-accent',
      )}
    >
      {children}
    </a>
  )
}

export default NavLink
