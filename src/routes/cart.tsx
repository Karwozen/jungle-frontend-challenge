import { createFileRoute } from '@tanstack/react-router'
import Cart from '@/pages/cart'

export const Route = createFileRoute('/cart')({
  component: Cart,
})
