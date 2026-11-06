import { createFileRoute } from '@tanstack/react-router'
import { catalogSearch } from '@/features/catalog/search'
import Home from '@/pages/home'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearch,
  component: Home,
})
