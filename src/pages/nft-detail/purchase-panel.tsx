import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Heart, Linkedin, Mail, Minus, Plus, ShoppingCart, Star, Twitter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Edition, Nft } from '@/domain/catalog/schema'
import { useAddToCart } from '@/features/cart/use-add-to-cart'
import { useFavorite } from '@/features/favorites/use-favorite'
import { compareEth, formatEth, mulEth } from '@/lib/eth'
import { outOfScope } from '@/lib/out-of-scope'
import { cn } from '@/lib/utils'
import Rating from './rating'

const editionLabel = (edition: Edition) => (edition.kind === 'open' ? 'Aberta' : `1/${edition.supply}`)

const inStock = (edition: Edition) => edition.available !== 0

const shareLinks = [
  { label: 'LinkedIn', icon: Linkedin },
  { label: 'E-mail', icon: Mail },
  { label: 'Twitter', icon: Twitter },
]

function PurchasePanel({ nft }: { nft: Nft }) {
  const navigate = useNavigate()
  const addToCart = useAddToCart()
  const favorite = useFavorite(nft.id)

  const initial =
    nft.editions.find((e) => inStock(e) && compareEth(e.price, nft.price) === 0) ??
    nft.editions.find(inStock) ??
    nft.editions[0]
  const [editionId, setEditionId] = useState(initial.id)
  const [quantity, setQuantity] = useState(1)

  const edition = nft.editions.find((e) => e.id === editionId) ?? initial
  const maxQuantity = Math.min(nft.maxPerOrder, edition.available ?? nft.maxPerOrder)
  const soldOut = !inStock(edition)

  const add = () => addToCart.mutateAsync({ nftId: nft.id, editionId, quantity })
  const buy = () => add().then(() => navigate({ to: '/cart' }), () => undefined)

  return (
    <div className="relative flex flex-col gap-4 max-md:-mt-6 max-md:rounded-t-[1.75rem] max-md:bg-card max-md:px-6 max-md:pt-6 max-md:pb-8">
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-xl font-bold md:text-3xl">{nft.name}</h1>
        <div className="md:hidden">
          <Rating average={nft.rating.average} count={nft.rating.count} />
        </div>
      </div>

      <div className="hidden items-center justify-between gap-4 border-b border-border-soft pb-3 md:flex">
        <p className="text-2xl font-bold text-text-accent">{formatEth(edition.price)}</p>
        <p className="flex items-center gap-2 text-sm">
          <span role="img" aria-label={`Nota ${nft.rating.average.toFixed(1)} de 5`} className="flex gap-0.5">
            {Array.from({ length: 5 }, (_, i) => (
              <Star
                key={i}
                aria-hidden
                className={cn('size-3.5', i < Math.round(nft.rating.average) ? 'fill-text-accent text-text-accent' : 'text-border-soft')}
              />
            ))}
          </span>
          {nft.rating.count} avaliações de colecionadores
        </p>
      </div>

      <div>
        <p className="mb-1 hidden text-sm font-bold md:block">Sobre este NFT:</p>
        <p className="text-sm text-text-secondary max-md:line-clamp-3">{nft.summary}</p>
      </div>

      <div role="radiogroup" aria-label="Edição" className="flex flex-wrap items-center gap-2">
        <span className="w-full text-sm font-bold">Edição:</span>
        {nft.editions.map((item) => (
          <button
            key={item.id}
            type="button"
            role="radio"
            aria-checked={item.id === editionId}
            disabled={!inStock(item)}
            onClick={() => {
              setEditionId(item.id)
              setQuantity(1)
            }}
            className={cn(
              'rounded-full border border-border-soft px-3 py-0.5 text-xs uppercase outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:line-through disabled:opacity-50',
              item.id === editionId && 'border-primary font-bold text-text-accent',
            )}
          >
            {editionLabel(item)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 max-md:fixed max-md:inset-x-0 max-md:-bottom-[3px] max-md:z-40 max-md:rounded-t-[1.5rem] max-md:bg-card max-md:shadow-[0_-0.5rem_1.5rem_rgb(0_0_0/0.45)] max-md:px-6 max-md:pt-5 max-md:pb-6 md:flex-row md:items-center md:justify-between -bottom-px">
        <div className="flex items-center gap-2 text-sm">
          <span id="quantity-label" className="md:sr-only">
            Qtd.
          </span>
          <Button
            type="button"
            size="icon"
            className="size-5 rounded-full md:size-7"
            aria-label="Diminuir quantidade"
            disabled={quantity <= 1}
            onClick={() => setQuantity((q) => q - 1)}
          >
            <Minus />
          </Button>
          <output aria-labelledby="quantity-label" className="w-6 text-center">
            {quantity}
          </output>
          <Button
            type="button"
            size="icon"
            className="size-5 rounded-full md:size-7"
            aria-label="Aumentar quantidade"
            disabled={quantity >= maxQuantity}
            onClick={() => setQuantity((q) => q + 1)}
          >
            <Plus />
          </Button>
          <p className="ml-auto pl-4 text-lg font-bold text-text-accent md:hidden">
            {formatEth(mulEth(edition.price, quantity))}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            size="lg"
            className="px-6 uppercase max-md:normal-case max-md:h-14 max-md:w-48 max-md:flex-none max-md:rounded-full max-md:bg-linear-to-br max-md:from-primary max-md:to-[color-mix(in_oklab,var(--primary),black_30%)] max-md:text-base max-md:font-bold md:h-9"
            disabled={soldOut || addToCart.isPending}
            onClick={buy}
          >
            {soldOut ? 'Esgotado' : <>Comprar<span className="md:hidden"> NFT</span></>}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="size-14 rounded-full border-border bg-[#2f1d15] text-gold hover:bg-[#2f1d15]/80 md:hidden"
            aria-label="Adicionar ao carrinho"
            disabled={soldOut || addToCart.isPending}
            onClick={() => add().catch(() => undefined)}
          >
            <ShoppingCart />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-9 max-md:hidden"
            aria-pressed={favorite.active}
            onClick={favorite.toggle}
          >
            <Heart className={cn(favorite.active && 'fill-red-500 text-red-500')} /> Favoritar
          </Button>
        </div>
      </div>

      <dl className="space-y-2 max-md:order-1 text-sm text-text-secondary md:space-y-3">
        <div className="flex gap-1">
          <dt>ID do token:</dt>
          <dd>#{nft.tokenId}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Coleção:</dt>
          <dd>{nft.collection.name}</dd>
        </div>
        <div className="flex gap-1">
          <dt>Atributos:</dt>
          <dd>{nft.traits.map((trait) => trait.value).join(', ')}</dd>
        </div>
      </dl>

      <div className="hidden items-center gap-3 text-sm font-bold md:flex">
        Compartilhar este NFT:
        {shareLinks.map(({ label, icon: Icon }) => (
          <button
            key={label}
            type="button"
            aria-label={`Compartilhar no ${label}`}
            onClick={outOfScope}
            className="rounded-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <Icon className="size-4" />
          </button>
        ))}
      </div>
    </div>
  )
}

export default PurchasePanel
