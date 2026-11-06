import { useState } from 'react'
import type { Nft } from '@/domain/catalog/schema'
import { cn } from '@/lib/utils'
import Reviews from './reviews'

type Tab = 'details' | 'reviews'

function DetailsTabs({ nft }: { nft: Nft }) {
  const [tab, setTab] = useState<Tab>('details')

  const tabs: { id: Tab; label: string }[] = [
    { id: 'details', label: 'Detalhes do NFT' },
    { id: 'reviews', label: `Avaliações de colecionadores (${nft.rating.count})` },
  ]

  return (
    <section className="mt-12">
      <div role="tablist" aria-label="Informações do NFT" className="flex gap-6 border-b border-border-soft justify-center md:justify-start">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            id={`tab-${id}`}
            type="button"
            role="tab"
            aria-selected={tab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setTab(id)}
            className={cn(
              '-mb-px border-b-2 border-transparent pb-3 text-left text-xs outline-none md:text-sm focus-visible:text-text-accent',
              tab === id && 'border-primary font-bold text-text-accent',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`} className="pt-6">
        {tab === 'details' ? (
          <div className="space-y-4 text-sm text-text-secondary">
            <p>{nft.description}</p>
            <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
              {nft.traits.map((trait) => (
                <div key={trait.type} className="flex gap-1">
                  <dt className="font-bold text-foreground">{trait.type}:</dt>
                  <dd>{trait.value}</dd>
                </div>
              ))}
              <div className="flex gap-1">
                <dt className="font-bold text-foreground">Criador:</dt>
                <dd>{nft.collection.creator.name}</dd>
              </div>
              <div className="flex gap-1">
                <dt className="font-bold text-foreground">Royalties:</dt>
                <dd>{nft.collection.royaltyPercent}%</dd>
              </div>
              <div className="flex gap-1">
                <dt className="font-bold text-foreground">Padrão:</dt>
                <dd>
                  {nft.contract.standard}
                  {nft.contract.verified && ' (verificado)'}
                </dd>
              </div>
              <div className="flex gap-1 break-all">
                <dt className="shrink-0 font-bold text-foreground">Contrato:</dt>
                <dd>{nft.contract.address}</dd>
              </div>
            </dl>
          </div>
        ) : (
          <Reviews nftId={nft.id} />
        )}
      </div>
    </section>
  )
}

export default DetailsTabs
