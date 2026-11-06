import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/features/auth/guard'
import Profile from '@/pages/profile'

export const Route = createFileRoute('/profile')({
  beforeLoad: requireSession,
  component: Profile,
})
