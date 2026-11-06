import { useQuery } from '@tanstack/react-query'
import { cartQuery } from '@/domain/cart/queries'
import { useSession } from '@/features/auth/use-session'
import { useGuestCart } from './guest-cart'

export function useCartCount() {
  const { data: session } = useSession()
  const guest = useGuestCart()
  const cart = useQuery({ ...cartQuery(session?.user.id ?? ''), enabled: !!session })

  const items = session ? (cart.data?.items ?? []) : guest
  return items.reduce((total, item) => total + item.quantity, 0)
}
