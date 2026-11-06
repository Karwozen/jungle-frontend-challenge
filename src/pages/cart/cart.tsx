import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import SummaryRows from '@/components/cart/summary-rows'
import Breadcrumb from '@/components/layout/breadcrumb'
import MobilePageHeader from '@/components/layout/mobile-page-header'
import NftCard from '@/components/nft/nft-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { catalogListQuery } from '@/domain/catalog/queries'
import { quoteQuery } from '@/domain/quote/queries'
import { useCart } from '@/features/cart/use-cart'
import CartItemRow from './cart-item-row'
import CouponForm from './coupon-form'

function Cart() {
  const cart = useCart()
  const lines = cart.items.map(({ nftId, editionId, quantity }) => ({ nftId, editionId, quantity }))
  const quote = useQuery({
    ...quoteQuery({ items: lines, coupon: cart.coupon ?? undefined }),
    enabled: lines.length > 0,
  })
  const suggestions = useQuery(catalogListQuery({ sort: 'rating' }))
  const priceChanged = cart.items.some((item) => item.unitPrice !== item.addedPrice)
  const blocked = cart.items.some((item) => item.maxQuantity === 0) || !quote.data

  return (
    <div className="mx-auto w-full max-w-300 px-6 py-6 max-md:pb-96 md:py-10 xl:px-0">
      <Breadcrumb current="Carrinho" />
      <MobilePageHeader title="Carrinho de NFTs" />
      <h1 className="sr-only">Carrinho de NFTs</h1>

      {cart.isPending ? (
        <div aria-busy className="grid gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : cart.isError ? (
        <div role="alert" className="flex flex-col items-start gap-3">
          <p className="text-sm">Não foi possível carregar o carrinho.</p>
          <Button onClick={() => cart.refetch()}>Tentar novamente</Button>
        </div>
      ) : cart.items.length === 0 ? (
        <div className="mt-6 flex flex-col items-center gap-4 rounded-lg bg-card p-10 text-center">
          <p className="text-sm text-muted-foreground">Seu carrinho está vazio.</p>
          <Button asChild>
            <Link to="/" hash="catalogo">
              Explorar NFTs
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid items-start gap-8 lg:grid-cols-[1fr_22rem]">
          <div className="space-y-3">
            {priceChanged && (
              <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
                <p>O preço de alguns itens mudou desde que você os adicionou.</p>
                <Button type="button" size="sm" onClick={() => cart.acknowledge.mutate()}>
                  Aceitar novos preços
                </Button>
              </div>
            )}
            <div aria-hidden className="hidden grid-cols-[minmax(0,1fr)_6rem_7rem_6rem_2rem] gap-3 px-2 pb-1 text-xs font-bold md:grid">
              <span>NFTs</span>
              <span>Preço</span>
              <span>Edições</span>
              <span>Total</span>
              <span />
            </div>
            <ul className="space-y-3" aria-label="Itens do carrinho">
              {cart.items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onQuantity={(quantity) => cart.setQuantity.mutate({ item, quantity })}
                  onRemove={() => cart.remove.mutate(item)}
                />
              ))}
            </ul>
          </div>

          <aside
            aria-label="Resumo do pedido"
            className="space-y-4 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:rounded-t-[1.5rem] max-md:bg-card max-md:px-6 max-md:pt-5 max-md:pb-6 max-md:shadow-[0_-0.5rem_1.5rem_rgb(0_0_0/0.45)]"
          >
            <h2 className="border-b border-border-soft pb-2 text-sm font-bold max-md:hidden">Resumo da carteira</h2>
            {cart.signedIn ? (
              <CouponForm applied={cart.coupon} percent={quote.data?.coupon?.percent} mutation={cart.applyCoupon} />
            ) : (
              <p className="text-xs text-muted-foreground">Entre na sua conta para aplicar um cupom.</p>
            )}
            <SummaryRows totals={quote.data} />
            {quote.isError && (
              <p role="alert" className="text-xs text-destructive">
                Não foi possível calcular os valores.
              </p>
            )}
            {blocked ? (
              <Button size="lg" className="h-11 w-full" disabled>
                Conectar e finalizar
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="h-12 w-full max-md:rounded-full max-md:bg-linear-to-br max-md:from-primary max-md:to-[color-mix(in_oklab,var(--primary),black_30%)] max-md:font-bold md:h-9"
              >
                {cart.signedIn ? (
                  <Link to="/checkout">Conectar e finalizar</Link>
                ) : (
                  <Link to="." search={(prev) => ({ ...prev, auth: 'login', redirect: '/checkout' })}>
                    Conectar e finalizar
                  </Link>
                )}
              </Button>
            )}
            <Link to="/" hash="catalogo" className="block text-center text-xs text-text-accent max-md:hidden">
              Continuar explorando
            </Link>
          </aside>
        </div>
      )}

      {suggestions.data && suggestions.data.items.length > 0 && (
        <section aria-labelledby="also-viewed" className="mt-16 max-md:hidden">
          <h2 id="also-viewed" className="border-b border-border-soft pb-2 text-sm font-bold text-text-accent">
            Colecionadores também viram
          </h2>
          <ul className="mt-6 grid grid-cols-3 gap-4 lg:grid-cols-5">
            {suggestions.data.items.slice(0, 5).map((item) => (
              <li key={item.id}>
                <NftCard nft={item} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export default Cart
