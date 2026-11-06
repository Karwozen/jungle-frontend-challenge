import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { addCartItem } from '@/domain/cart/api'
import { cartKey } from '@/domain/cart/queries'
import type { CartLine } from '@/domain/cart/schema'
import { sessionQuery } from '@/domain/auth/queries'
import { guestCart } from './guest-cart'

export function useAddToCart() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (line: CartLine) => {
      // Aguarda a resolução da sessão ativa para evitar tratar o usuário autenticado como visitante após um reload
      const session = await queryClient.ensureQueryData(sessionQuery).catch(() => null)
      if (!session) {
        guestCart.add(line)
        return { cart: null, userId: null }
      }
      await queryClient.cancelQueries({ queryKey: cartKey(session.user.id) })
      return { cart: await addCartItem(line), userId: session.user.id }
    },
    onSuccess: ({ cart, userId }) => {
      if (cart && userId) queryClient.setQueryData(cartKey(userId), cart)
      toast.success('Adicionado ao carrinho')
    },
    onError: (error) => toast.error(error.message),
  })
}
