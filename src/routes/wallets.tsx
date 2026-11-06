import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/features/auth/guard'
import Wallets from '@/pages/wallets'

export const Route = createFileRoute('/wallets')({
  beforeLoad: requireSession,
  component: Wallets,
})
