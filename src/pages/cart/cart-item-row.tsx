import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CartItem } from '@/domain/cart/schema'
import { nftDetailQuery } from '@/domain/catalog/queries'
import { compareEth, formatEth, mulEth } from '@/lib/eth'
import { imageSrcSet } from '@/lib/images'

interface CartItemRowProps {
  item: CartItem
  onQuantity: (quantity: number) => void
  onRemove: () => void
}

function CartItemRow({ item, onQuantity, onRemove }: CartItemRowProps) {
  const { data: nft } = useQuery(nftDetailQuery(item.nftId))
  const edition = nft?.editions.find((e) => e.id === item.editionId)
  const editionLabel = edition ? (edition.kind === 'open' ? 'Aberta' : `1/${edition.supply}`) : ''
  const priceChanged = compareEth(item.unitPrice, item.addedPrice) !== 0
  const soldOut = item.maxQuantity === 0

  const stepper = (
    <div className="flex items-center gap-2 text-sm">
      <Button
        type="button"
        size="icon"
        className="size-5 rounded-full"
        aria-label={`Diminuir quantidade de ${item.name}`}
        disabled={item.quantity <= 1}
        onClick={() => onQuantity(item.quantity - 1)}
      >
        <Minus />
      </Button>
      <output aria-label={`Quantidade de ${item.name}`} className="w-4 text-center">
        {item.quantity}
      </output>
      <Button
        type="button"
        size="icon"
        className="size-5 rounded-full"
        aria-label={`Aumentar quantidade de ${item.name}`}
        disabled={item.quantity >= item.maxQuantity}
        onClick={() => onQuantity(item.quantity + 1)}
      >
        <Plus />
      </Button>
    </div>
  )

  return (
    <li className="grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 rounded-lg bg-card p-3 md:grid-cols-[minmax(0,1fr)_6rem_7rem_6rem_2rem] md:gap-3 md:p-2">
      <Link
        to="/nft/$id"
        params={{ id: item.nftId }}
        className="flex min-w-0 items-center gap-3 rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50 max-md:contents"
      >
        <img
          src={item.image.variants[0]?.url ?? item.image.url}
          srcSet={imageSrcSet(item.image)}
          sizes="5rem"
          alt=""
          width={80}
          height={80}
          className="size-20 rounded-md object-cover max-md:row-span-3 md:size-9"
        />
        <span className="min-w-0 max-md:contents">
          <span className="block text-sm font-bold md:truncate">{item.name}</span>
          <span className="block text-xs text-text-secondary max-md:hidden">ID do token: #{nft?.tokenId}</span>
        </span>
      </Link>

      <p className="text-xs text-text-secondary md:hidden">{editionLabel && `Edição: ${editionLabel}`}</p>

      <p className="text-sm font-bold text-text-accent max-md:col-start-2 max-md:row-start-3 md:order-none md:text-xs">
        {formatEth(item.unitPrice)}
        {priceChanged && (
          <span className="block text-tiny font-normal text-warning">
            era <s>{formatEth(item.addedPrice)}</s>
          </span>
        )}
      </p>

      <div className="max-md:col-start-3 max-md:row-span-3 max-md:row-start-1 max-md:flex max-md:items-center max-md:gap-2">
        {stepper}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Remover ${item.name}`}
          className="md:hidden"
          onClick={onRemove}
        >
          <Trash2 />
        </Button>
      </div>

      <p className="text-xs font-bold text-text-accent max-md:hidden">{formatEth(mulEth(item.unitPrice, item.quantity))}</p>
      <Button type="button" variant="ghost" size="icon-sm" aria-label={`Remover ${item.name}`} className="max-md:hidden" onClick={onRemove}>
        <Trash2 />
      </Button>

      {soldOut && (
        <p role="alert" className="col-span-full text-xs text-destructive">
          Esgotado: remova este item para continuar.
        </p>
      )}
    </li>
  )
}

export default CartItemRow
