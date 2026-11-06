import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/features/auth/guard'
import Checkout from '@/pages/checkout'

export const Route = createFileRoute('/checkout')({
  beforeLoad: requireSession,
  component: Checkout,
})
