import { useLayoutEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from '@tanstack/react-router'
import { useScrolledPast } from '@/hooks/use-scrolled-past'
import { outOfScope } from '@/lib/out-of-scope'
import NavLink from './nav-link'

interface Bar {
  x: number
  width: number
  visible: boolean
}

function MainNav() {
  const onHome = useLocation({ select: (location) => location.pathname === '/' })
  const inDetail = useLocation({ select: (location) => /^\/(nft|cart|checkout|orders)(\/|$)/.test(location.pathname) })
  const navigate = useNavigate()
  const inMarket = useScrolledPast('catalogo')
  const navRef = useRef<HTMLElement>(null)
  const [bar, setBar] = useState<Bar | null>(null)

  useLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return

    const measure = () => {
      const active = nav.querySelector<HTMLElement>('[data-active="true"]')
      setBar((prev) =>
        active
          ? { x: active.offsetLeft, width: active.offsetWidth, visible: true }
          : prev && { ...prev, visible: false },
      )
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(nav)
    return () => observer.disconnect()
  }, [onHome, inMarket, inDetail])

  const backToTop = (event: React.MouseEvent) => {
    if (!onHome) return
    event.preventDefault()
    navigate({ to: '/', hash: undefined, search: (prev) => prev, replace: true, resetScroll: false })
    window.scrollTo({ top: 0 })
  }

  return (
    <nav ref={navRef} aria-label="Principal" className="relative flex gap-8">
      <NavLink current={onHome && !inMarket} onClick={backToTop}>
        Início
      </NavLink>
      <NavLink hash="catalogo" current={(onHome && inMarket) || inDetail}>
        Mercado
      </NavLink>
      <button
        type="button"
        onClick={outOfScope}
        className="relative flex h-14 items-center px-1 text-sm outline-none focus-visible:text-text-accent"
      >
        Criadores
      </button>
      <button
        type="button"
        onClick={outOfScope}
        className="relative flex h-14 items-center px-1 text-sm outline-none focus-visible:text-text-accent"
      >
        Aprenda
      </button>

      {bar && (
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 h-0.5 bg-text-accent motion-safe:transition-[transform,width,opacity] motion-safe:duration-500 motion-safe:ease-out-expo"
          style={{ transform: `translateX(${bar.x}px)`, width: bar.width, opacity: bar.visible ? 1 : 0 }}
        />
      )}
    </nav>
  )
}

export default MainNav
