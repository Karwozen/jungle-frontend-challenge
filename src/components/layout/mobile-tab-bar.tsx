import { useLocation, useNavigate } from '@tanstack/react-router'
import { Heart, House, ScanLine, ShoppingCart, User } from 'lucide-react'
import { useCartCount } from '@/features/cart/use-cart-count'
import { focusCatalogSearch } from '@/features/catalog/focus-search'
import TabLink from './tab-link'

function MobileTabBar() {
  const count = useCartCount()
  const navigate = useNavigate()
  const onHome = useLocation({ select: (location) => location.pathname === '/' })
  const inFlow = useLocation({ select: (location) => /^\/(nft|cart|checkout|orders)(\/|$)/.test(location.pathname) })

  const explore = async () => {
    if (!onHome) await navigate({ to: '/' })
    focusCatalogSearch()
  }

  if (inFlow) return null

  return (
    <nav
      aria-label="Principal"
      className="fixed inset-x-0 -bottom-px z-40 grid h-22 grid-cols-[1fr_1fr_9.5rem_1fr_1fr] rounded-t-[2.5rem] bg-card md:hidden"
    >
      <TabLink to="/" label="Início">
        <House className="size-6" />
      </TabLink>
      <TabLink to="/favorites" label="Favoritos">
        <Heart className="size-6 fill-current" />
      </TabLink>

      <div className="relative">
        <svg
          aria-hidden
          viewBox="0 0 152 58"
          className="absolute top-0 left-1/2 h-[3.625rem] w-[9.5rem] -translate-x-1/2 fill-background"
        >
          <path d="M5.38 0H146.62A14 14 0 0 0 132.89 11.28A58 58 0 0 1 19.11 11.28A14 14 0 0 0 5.38 0Z" />
        </svg>
        <button
          type="button"
          aria-label="Explorar coleções"
          onClick={explore}
          className="absolute top-0 left-1/2 flex size-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-linear-to-br from-primary to-[color-mix(in_oklab,var(--primary),black_30%)] opacity-80"
          />
          <ScanLine className="relative size-8" />
        </button>
      </div>

      <TabLink to="/cart" label={count ? `Carrinho, ${count} ${count === 1 ? 'item' : 'itens'}` : 'Carrinho'}>
        <span className="relative">
          <ShoppingCart className="size-6" />
          {count > 0 && (
            <span
              aria-hidden
              className="absolute -top-2 -right-3 flex size-4 items-center justify-center rounded-full bg-primary text-tiny font-bold text-primary-foreground"
            >
              {count}
            </span>
          )}
        </span>
      </TabLink>
      <TabLink to="/profile" label="Perfil">
        <User className="size-6" />
      </TabLink>
    </nav>
  )
}

export default MobileTabBar
