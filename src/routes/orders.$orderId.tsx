import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/features/auth/guard'
import Order from '@/pages/order'

export const Route = createFileRoute('/orders/$orderId')({
  beforeLoad: requireSession,
  component: Order,
})
