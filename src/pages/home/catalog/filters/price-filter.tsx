import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import type { PriceRange } from '@/domain/catalog/schema'
import { useCatalogSearch } from '@/features/catalog/use-catalog-search'

interface PriceFilterProps {
  range?: PriceRange | null
  failed?: boolean
}

const fmt = (value: number) => value.toFixed(2)

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

function PriceFilter({ range, failed }: PriceFilterProps) {
  const titleId = useId()

  return (
    <section aria-labelledby={titleId} className="mt-8">
      <h2 id={titleId} className="text-sm font-bold">
        Faixa de preço
      </h2>
      {range ? (
        <PriceSlider min={Math.floor(Number(range.min) * 100) / 100} max={Math.ceil(Number(range.max) * 100) / 100} />
      ) : range === null ? (
        <p className="mt-3 text-xs text-muted-foreground">Nenhum NFT para os filtros atuais.</p>
      ) : failed ? (
        <p role="status" className="mt-3 text-xs text-muted-foreground">
          Faixa de preço indisponível no momento.
        </p>
      ) : (
        <div aria-busy className="mt-4 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      )}
    </section>
  )
}

function PriceSlider({ min, max }: { min: number; max: number }) {
  const { search, update } = useCatalogSearch()
  const applied: [number, number] = [
    clamp(Number(search.minPrice ?? min), min, max),
    clamp(Number(search.maxPrice ?? max), min, max),
  ]
  const [draft, setDraft] = useState(applied)

  // Sincroniza o estado interno do controle deslizante quando a navegação altera os parâmetros da URL
  const [seen, setSeen] = useState(applied.join())
  if (seen !== applied.join()) {
    setSeen(applied.join())
    setDraft(applied)
  }

  const current: [number, number] = [clamp(draft[0], min, max), clamp(draft[1], min, max)]

  if (min >= max) {
    return <p className="mt-3 text-xs">Todos os NFTs custam {fmt(min)} ETH.</p>
  }

  const apply = () =>
    update({
      minPrice: current[0] > min ? fmt(current[0]) : undefined,
      maxPrice: current[1] < max ? fmt(current[1]) : undefined,
    })

  return (
    <>
      <Slider
        min={min}
        max={max}
        step={0.01}
        minStepsBetweenThumbs={1}
        value={current}
        onValueChange={(value) => setDraft([value[0], value[1]])}
        aria-label="Faixa de preço em ETH"
        className="mt-4"
      />
      <p className="mt-3 text-xs">
        Preço: {fmt(current[0])} - {fmt(current[1])} ETH
      </p>
      <Button size="sm" onClick={apply} className="mt-3">
        Aplicar
      </Button>
    </>
  )
}

export default PriceFilter
