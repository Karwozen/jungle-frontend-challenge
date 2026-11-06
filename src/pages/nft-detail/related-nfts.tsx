import { useQuery } from '@tanstack/react-query'
import NftCard from '@/components/nft/nft-card'
import { catalogListQuery } from '@/domain/catalog/queries'
import type { Nft } from '@/domain/catalog/schema'

function RelatedNfts({ nft }: { nft: Nft }) {
  const { data } = useQuery(catalogListQuery({ collection: nft.collection.id, exclude: nft.id }))
  const items = data?.items.slice(0, 5) ?? []

  if (!items.length) return null

  return (
    <section aria-labelledby="related-title" className="mt-16">
      <h2 id="related-title" className="text-lg font-bold">
        Mais desta coleção
      </h2>
      <ul className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
        {items.map((item) => (
          <li key={item.id} className="max-md:last:hidden">
            <NftCard nft={item} />
          </li>
        ))}
      </ul>
    </section>
  )
}

export default RelatedNfts
