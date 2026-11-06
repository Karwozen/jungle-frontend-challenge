import { createFileRoute } from '@tanstack/react-router'
import NftDetail from '@/pages/nft-detail'

export const Route = createFileRoute('/nft/$id')({
  component: NftDetail,
})
