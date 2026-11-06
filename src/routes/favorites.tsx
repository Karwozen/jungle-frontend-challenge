import { createFileRoute } from '@tanstack/react-router'
import { requireSession } from '@/features/auth/guard'
import Favorites from '@/pages/favorites'

export const Route = createFileRoute('/favorites')({
  beforeLoad: requireSession,
  component: Favorites,
})
