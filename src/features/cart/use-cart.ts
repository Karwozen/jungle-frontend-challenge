import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { acknowledgePrices, applyCoupon, removeCartItem, removeCoupon, updateCartItem } from '@/domain/cart/api'
import { cartKey, cartQuery } from '@/domain/cart/queries'
import type { Cart, CartItem, CartLine } from '@/domain/cart/schema'
import { nftDetailQuery } from '@/domain/catalog/queries'
import { useSession } from '@/features/auth/use-session'
import { guestCart, useGuestCart } from './guest-cart'

export const lineId = (line: Pick<CartLine, 'nftId' | 'editionId'>) => `${line.nftId}:${line.editionId}`

export function useCart() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  const guestLines = useGuestCart()
  const userId = session?.user.id ?? ''

  const server = useQuery({ ...cartQuery(userId), enabled: !!session })

  const nftIds = [...new Set(guestLines.map((line) => line.nftId))]
  const details = useQueries({ queries: nftIds.map((id) => ({ ...nftDetailQuery(id), enabled: !session })) })

  const guestItems: CartItem[] = guestLines.flatMap((line) => {
    const nft = details.find((query) => query.data?.id === line.nftId)?.data
    const edition = nft?.editions.find((e) => e.id === line.editionId)
    if (!nft || !edition) return []
    return [
      {
        ...line,
        id: lineId(line),
        name: nft.name,
        image: nft.image,
        unitPrice: edition.price,
        addedPrice: edition.price,
        available: edition.available,
        maxQuantity: Math.min(nft.maxPerOrder, edition.available ?? nft.maxPerOrder),
      },
    ]
  })

  const items = session ? (server.data?.items ?? []) : guestItems
  const isPending = session ? server.isPending : details.some((query) => query.isPending)

  const save = (cart: Cart) => queryClient.setQueryData(cartKey(userId), cart)
  const fail = (error: Error) => toast.error(error.message)
  // Cancela buscas pendentes do carrinho para evitar sobrescrever o retorno mais recente da mutação
  const settle = () => queryClient.cancelQueries({ queryKey: cartKey(userId) })

  const setQuantity = useMutation({
    mutationFn: async ({ item, quantity }: { item: CartItem; quantity: number }) => {
      if (!session) {
        guestCart.setQuantity(item, quantity)
        return null
      }
      return updateCartItem(item.id, quantity)
    },
    onMutate: settle,
    onSuccess: (cart) => cart && save(cart),
    onError: fail,
  })

  const remove = useMutation({
    mutationFn: async (item: CartItem) => {
      if (!session) {
        guestCart.remove(item)
        return null
      }
      return removeCartItem(item.id)
    },
    onMutate: settle,
    onSuccess: (cart) => cart && save(cart),
    onError: fail,
  })

  const coupon = useMutation({
    mutationFn: (code: string | null) => (code ? applyCoupon(code) : removeCoupon()),
    onMutate: settle,
    onSuccess: save,
  })

  const acknowledge = useMutation({ mutationFn: acknowledgePrices, onMutate: settle, onSuccess: save, onError: fail })

  return {
    items,
    isPending,
    isError: session ? server.isError : false,
    refetch: server.refetch,
    coupon: server.data?.coupon ?? null,
    signedIn: !!session,
    setQuantity,
    remove,
    applyCoupon: coupon,
    acknowledge,
  }
}
